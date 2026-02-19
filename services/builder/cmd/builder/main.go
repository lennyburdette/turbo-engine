// Package main is the entrypoint for the Builder service.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/engine"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/handler"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/store"
)

func main() {
	// Structured logging with slog.
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	port := envOr("PORT", "8082")

	// Initialize OpenTelemetry tracing.
	shutdown, err := initTracer(context.Background())
	if err != nil {
		logger.Error("failed to initialize tracer", "error", err)
		os.Exit(1)
	}

	// Build the dependency graph.
	memStore := store.NewMemoryStore()
	buildEngine := engine.New(memStore, logger)

	var idCounter atomic.Int64
	idFunc := func() string {
		return fmt.Sprintf("bld-%d-%d", time.Now().UnixMilli(), idCounter.Add(1))
	}

	h := handler.New(memStore, buildEngine, logger, idFunc)

	mux := http.NewServeMux()

	// Health check endpoint.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// Register builder API routes.
	h.RegisterRoutes(mux)

	// Wrap with OTEL HTTP instrumentation.
	otelHandler := otelhttp.NewHandler(mux, "builder",
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
	)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      otelHandler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second, // Longer for SSE streaming.
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown on SIGINT / SIGTERM.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("builder service starting", "port", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	// Block until signal.
	<-ctx.Done()
	logger.Info("shutdown signal received, draining connections")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", "error", err)
	}

	if err := shutdown(shutdownCtx); err != nil {
		logger.Error("tracer shutdown error", "error", err)
	}

	logger.Info("builder service stopped")
}

// initTracer sets up the OpenTelemetry trace provider with an OTLP gRPC exporter.
// Returns a shutdown function that flushes remaining spans.
func initTracer(ctx context.Context) (func(context.Context) error, error) {
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName("builder"),
			semconv.ServiceVersion("0.1.0"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("creating resource: %w", err)
	}

	// The OTLP exporter reads OTEL_EXPORTER_OTLP_ENDPOINT from the environment.
	// Defaults to localhost:4317 if unset.
	exporter, err := otlptracegrpc.New(ctx)
	if err != nil {
		// If the collector is not available, fall back to a noop provider so the
		// service still starts.
		slog.Warn("OTLP exporter unavailable, tracing disabled", "error", err)
		return func(context.Context) error { return nil }, nil
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp.Shutdown, nil
}

// envOr returns the value of the environment variable named key, or fallback
// if the variable is unset or empty.
func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
