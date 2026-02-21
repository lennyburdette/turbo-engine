// orchestrator is an RPC-to-REST translator service.
// It receives RPC-style requests (e.g. POST /rpc/listPets) and translates
// them into REST calls against a configured upstream API.
// Used as the intermediate component in the K8s E2E multi-package test.
// Logs every hop and propagates W3C traceparent for distributed tracing.
// Exports OTLP spans to the collector for correlated traces.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
)

var (
	upstreamURL string
	client      *http.Client
	tracer      trace.Tracer
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	upstreamURL = os.Getenv("UPSTREAM_URL")
	if upstreamURL == "" {
		upstreamURL = "http://localhost:8081"
	}
	upstreamURL = strings.TrimRight(upstreamURL, "/")

	// Initialise OpenTelemetry tracing.
	shutdown := initTracer()
	defer shutdown()

	tracer = otel.Tracer("orchestrator")

	// Wrap the default HTTP transport with OTel so outgoing requests
	// automatically create spans and propagate trace context.
	client = &http.Client{
		Timeout:   10 * time.Second,
		Transport: otelhttp.NewTransport(http.DefaultTransport),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", handleHealth)
	mux.HandleFunc("/rpc/listPets", handleListPets)
	mux.HandleFunc("/rpc/getPet", handleGetPet)
	mux.HandleFunc("/", handleCatchAll)

	// Wrap the mux with OTel HTTP handler for automatic inbound span creation.
	handler := otelhttp.NewHandler(withLogging(mux), "orchestrator")

	logJSON("info", "orchestrator starting", map[string]any{
		"port":         port,
		"upstream_url": upstreamURL,
	})
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		logJSON("error", "server exited", map[string]any{"error": err.Error()})
	}
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, 200, map[string]any{
		"status":       "ok",
		"service":      "orchestrator",
		"upstream_url": upstreamURL,
	})
}

func handleListPets(w http.ResponseWriter, r *http.Request) {
	callUpstream(w, r, "listPets", "GET", upstreamURL+"/pets")
}

func handleGetPet(w http.ResponseWriter, r *http.Request) {
	// Accept pet ID from query param or JSON body.
	id := r.URL.Query().Get("id")
	if id == "" && r.Body != nil {
		var params struct {
			ID string `json:"id"`
		}
		json.NewDecoder(r.Body).Decode(&params)
		id = params.ID
	}
	if id == "" {
		id = "1"
	}
	callUpstream(w, r, "getPet", "GET", upstreamURL+"/pets/"+id)
}

func handleCatchAll(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"service":      "orchestrator",
		"upstream_url": upstreamURL,
		"method":       r.Method,
		"path":         r.URL.Path,
		"query":        r.URL.RawQuery,
		"trace_id":     traceID(r),
	})
}

// ---------------------------------------------------------------------------
// Upstream call with full request/response logging
// ---------------------------------------------------------------------------

func callUpstream(w http.ResponseWriter, inReq *http.Request, rpcName, method, url string) {
	ctx := inReq.Context()
	tid := traceID(inReq)
	start := time.Now()

	// Create a child span for the upstream call.
	ctx, span := tracer.Start(ctx, "rpc/"+rpcName,
		trace.WithAttributes(
			attribute.String("rpc.method", rpcName),
			attribute.String("upstream.url", url),
			attribute.String("upstream.method", method),
		),
	)
	defer span.End()

	// Build upstream request with the traced context so the OTel transport
	// injects traceparent into the outgoing headers.
	upReq, err := http.NewRequestWithContext(ctx, method, url, nil)
	if err != nil {
		writeJSON(w, 500, map[string]any{
			"error": "failed to build upstream request",
			"rpc":   rpcName,
		})
		return
	}

	logJSON("info", "upstream call start", map[string]any{
		"rpc":      rpcName,
		"method":   method,
		"url":      url,
		"trace_id": tid,
	})

	// Execute upstream call (OTel transport handles span + propagation).
	resp, err := client.Do(upReq)
	dur := time.Since(start)
	if err != nil {
		span.SetAttributes(attribute.String("error", err.Error()))
		logJSON("error", "upstream call failed", map[string]any{
			"rpc":         rpcName,
			"url":         url,
			"error":       err.Error(),
			"duration_ms": dur.Milliseconds(),
			"trace_id":    tid,
		})
		writeJSON(w, 502, map[string]any{
			"error":    "upstream unavailable",
			"rpc":      rpcName,
			"detail":   err.Error(),
			"trace_id": tid,
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	span.SetAttributes(
		attribute.Int("upstream.status", resp.StatusCode),
		attribute.Int("upstream.response_bytes", len(body)),
	)

	logJSON("info", "upstream call complete", map[string]any{
		"rpc":             rpcName,
		"url":             url,
		"upstream_status": resp.StatusCode,
		"duration_ms":     dur.Milliseconds(),
		"trace_id":        tid,
		"response_bytes":  len(body),
	})

	// Parse upstream JSON response.
	var upstream any
	json.Unmarshal(body, &upstream)

	// Return RPC response envelope.
	w.Header().Set("X-Trace-Id", tid)
	w.Header().Set("X-Upstream-Status", fmt.Sprintf("%d", resp.StatusCode))
	writeJSON(w, 200, map[string]any{
		"rpc":                  rpcName,
		"trace_id":             tid,
		"upstream_url":         url,
		"upstream_status":      resp.StatusCode,
		"upstream_duration_ms": dur.Milliseconds(),
		"result":               upstream,
	})
}

// ---------------------------------------------------------------------------
// Logging middleware
// ---------------------------------------------------------------------------

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		tid := traceID(r)

		logJSON("info", "request received", map[string]any{
			"method":      r.Method,
			"path":        r.URL.Path,
			"query":       r.URL.RawQuery,
			"trace_id":    tid,
			"traceparent": r.Header.Get("Traceparent"),
			"x_request_id": r.Header.Get("X-Request-Id"),
		})

		rw := &statusWriter{ResponseWriter: w, code: 200}
		next.ServeHTTP(rw, r)

		logJSON("info", "response sent", map[string]any{
			"method":      r.Method,
			"path":        r.URL.Path,
			"status":      rw.code,
			"duration_ms": time.Since(start).Milliseconds(),
			"trace_id":    tid,
		})
	})
}

type statusWriter struct {
	http.ResponseWriter
	code int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.code = code
	sw.ResponseWriter.WriteHeader(code)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func traceID(r *http.Request) string {
	tp := r.Header.Get("Traceparent")
	if tp == "" {
		return ""
	}
	parts := strings.Split(tp, "-")
	if len(parts) >= 2 {
		return parts[1]
	}
	return tp
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func logJSON(level, msg string, fields map[string]any) {
	entry := map[string]any{"level": level, "msg": msg, "time": time.Now().UTC().Format(time.RFC3339Nano)}
	for k, v := range fields {
		entry[k] = v
	}
	data, _ := json.Marshal(entry)
	fmt.Println(string(data))
}

// ---------------------------------------------------------------------------
// OpenTelemetry initialisation
// ---------------------------------------------------------------------------

func initTracer() func() {
	endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if endpoint == "" {
		endpoint = "http://otel-collector:4318"
	}

	ctx := context.Background()

	exporter, err := otlptracehttp.New(ctx,
		otlptracehttp.WithEndpoint(strings.TrimPrefix(strings.TrimPrefix(endpoint, "http://"), "https://")),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		logJSON("warn", "failed to create OTLP exporter, tracing disabled", map[string]any{"error": err.Error()})
		return func() {}
	}

	res, _ := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String("orchestrator"),
			semconv.ServiceVersionKey.String("0.1.0"),
		),
	)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	return func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := tp.Shutdown(ctx); err != nil {
			logJSON("warn", "tracer shutdown error", map[string]any{"error": err.Error()})
		}
	}
}
