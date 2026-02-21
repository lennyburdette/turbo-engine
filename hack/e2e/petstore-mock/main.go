// petstore-mock is a fake REST API that serves pet data.
// Used as the upstream service in the K8s E2E multi-package test.
// It logs every request/response as JSON and propagates W3C traceparent.
// Exports OTLP spans to the collector for correlated traces.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

type pet struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Species string `json:"species"`
	Status  string `json:"status"`
}

var pets = []pet{
	{ID: 1, Name: "Buddy", Species: "dog", Status: "available"},
	{ID: 2, Name: "Whiskers", Species: "cat", Status: "available"},
	{ID: 3, Name: "Goldie", Species: "fish", Status: "sold"},
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialise OpenTelemetry tracing.
	shutdown := initTracer()
	defer shutdown()

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", handleHealth)
	mux.HandleFunc("/pets/", handlePetByID)
	mux.HandleFunc("/pets", handleListPets)
	mux.HandleFunc("/", handleCatchAll)

	// Wrap the mux with OTel HTTP handler for automatic inbound span creation.
	handler := otelhttp.NewHandler(withLogging(mux), "petstore-mock")

	logJSON("info", "petstore mock starting", map[string]any{"port": port})
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		logJSON("error", "server exited", map[string]any{"error": err.Error()})
	}
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, 200, map[string]any{"status": "ok", "service": "petstore-mock"})
}

func handleListPets(w http.ResponseWriter, r *http.Request) {
	tid := traceID(r)
	w.Header().Set("X-Trace-Id", tid)
	writeJSON(w, 200, map[string]any{
		"pets":     pets,
		"trace_id": tid,
	})
}

func handlePetByID(w http.ResponseWriter, r *http.Request) {
	tid := traceID(r)
	w.Header().Set("X-Trace-Id", tid)

	id := strings.TrimPrefix(r.URL.Path, "/pets/")
	for _, p := range pets {
		if fmt.Sprintf("%d", p.ID) == id {
			writeJSON(w, 200, map[string]any{"pet": p, "trace_id": tid})
			return
		}
	}
	writeJSON(w, 404, map[string]any{"error": "pet not found", "id": id, "trace_id": tid})
}

func handleCatchAll(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"service":  "petstore-mock",
		"method":   r.Method,
		"path":     r.URL.Path,
		"query":    r.URL.RawQuery,
		"trace_id": traceID(r),
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
	// traceparent: 00-{trace-id}-{span-id}-{flags}
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
			semconv.ServiceNameKey.String("petstore-mock"),
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
