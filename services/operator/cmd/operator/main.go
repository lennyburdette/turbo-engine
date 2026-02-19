// Package main is the entrypoint for the operator service.
//
// In a real Kubernetes cluster, this would use controller-runtime to watch
// APIGraph CRDs. For local development, it runs as an HTTP service that
// accepts reconciliation requests and polls the builder service for changes.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/handler"
	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
	"github.com/lennyburdette/turbo-engine/services/operator/internal/reconciler"
)

const serviceName = "operator"

func main() {
	// Set up structured logging.
	logLevel := getEnv("LOG_LEVEL", "info")
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: parseLogLevel(logLevel),
	}))
	slog.SetDefault(logger)

	logger.Info("starting operator service",
		"version", "0.1.0",
		"log_level", logLevel,
	)

	// Set up OpenTelemetry tracing.
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	shutdownTracer, err := initTracer(ctx)
	if err != nil {
		logger.Warn("failed to initialize tracer, continuing without tracing", "error", err)
	} else {
		defer func() {
			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()
			if err := shutdownTracer(shutdownCtx); err != nil {
				logger.Error("failed to shutdown tracer", "error", err)
			}
		}()
	}

	// Create the reconciler.
	rec := reconciler.New(logger)

	// Create HTTP handler and mux.
	h := handler.New(rec, logger)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	// Health check endpoint.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Configure the HTTP server.
	port := getEnv("PORT", "8084")
	addr := net.JoinHostPort("", port)
	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start the builder polling loop.
	builderURL := getEnv("BUILDER_URL", "http://localhost:8082")
	pollInterval := parseDuration(getEnv("POLL_INTERVAL", "30s"), 30*time.Second)
	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		pollBuilder(ctx, logger, rec, builderURL, pollInterval)
	}()

	// Start the HTTP server.
	go func() {
		logger.Info("listening", "addr", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for shutdown signal.
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigCh
	logger.Info("received signal, shutting down", "signal", sig)

	cancel() // Stop the polling loop.

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown failed", "error", err)
	}

	wg.Wait()
	logger.Info("operator service stopped")
}

// pollBuilder periodically polls the builder service for API graph specs
// and triggers reconciliation when changes are detected.
func pollBuilder(ctx context.Context, logger *slog.Logger, rec *reconciler.Reconciler, builderURL string, interval time.Duration) {
	logger = logger.With("component", "poller", "builder_url", builderURL)
	logger.Info("starting builder poll loop", "interval", interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("stopping builder poll loop")
			return
		case <-ticker.C:
			pollOnce(ctx, logger, rec, builderURL)
		}
	}
}

// pollOnce makes a single request to the builder service to fetch current
// API graph specs and reconciles any changes.
func pollOnce(ctx context.Context, logger *slog.Logger, rec *reconciler.Reconciler, builderURL string) {
	tracer := otel.Tracer("operator/poller")
	ctx, span := tracer.Start(ctx, "pollBuilder")
	defer span.End()

	endpoint := fmt.Sprintf("%s/v1/graphs", strings.TrimRight(builderURL, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		logger.ErrorContext(ctx, "failed to create poll request", "error", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		logger.DebugContext(ctx, "failed to poll builder (will retry)", "error", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.WarnContext(ctx, "builder returned non-200 status", "status", resp.StatusCode)
		return
	}

	var graphs []model.APIGraphSpec
	if err := json.NewDecoder(resp.Body).Decode(&graphs); err != nil {
		logger.ErrorContext(ctx, "failed to decode builder response", "error", err)
		return
	}

	logger.InfoContext(ctx, "polled builder", "graph_count", len(graphs))

	for _, spec := range graphs {
		actions, status, err := rec.Reconcile(ctx, spec)
		if err != nil {
			logger.ErrorContext(ctx, "reconciliation failed",
				"environment_id", spec.EnvironmentID,
				"error", err,
			)
			continue
		}
		logger.InfoContext(ctx, "reconciled graph",
			"environment_id", spec.EnvironmentID,
			"build_id", spec.BuildID,
			"actions", len(actions),
			"phase", status.Phase,
		)
	}
}

// initTracer sets up the OTEL trace exporter and provider.
func initTracer(ctx context.Context) (func(context.Context) error, error) {
	otelEndpoint := getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317")

	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(otelEndpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, fmt.Errorf("creating OTLP exporter: %w", err)
	}

	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(serviceName),
			semconv.ServiceVersion("0.1.0"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("creating resource: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)

	return tp.Shutdown, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseLogLevel(s string) slog.Level {
	switch strings.ToLower(s) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func parseDuration(s string, fallback time.Duration) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return fallback
	}
	return d
}
