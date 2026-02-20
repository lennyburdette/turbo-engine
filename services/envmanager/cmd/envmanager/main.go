// Package main is the entrypoint for the Environment Manager service.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/handler"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/orchestrator"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/store"
)

const (
	serviceName    = "envmanager"
	defaultPort    = "8083"
	shutdownTimeout = 10 * time.Second
)

func main() {
	// --- Logger ---
	logLevel := slog.LevelInfo
	if lvl := os.Getenv("LOG_LEVEL"); lvl == "debug" {
		logLevel = slog.LevelDebug
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))
	slog.SetDefault(logger)

	// --- OpenTelemetry ---
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	tp, err := initTracer(ctx)
	if err != nil {
		logger.Warn("failed to initialize tracer, continuing without tracing", slog.String("error", err.Error()))
		tp = sdktrace.NewTracerProvider()
	}
	defer func() {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()
		if err := tp.Shutdown(shutdownCtx); err != nil {
			logger.Error("failed to shutdown tracer", slog.String("error", err.Error()))
		}
	}()

	// --- Dependencies ---
	memStore := store.NewMemoryStore()
	builder := &stubBuilderClient{logger: logger}
	operator := &stubOperatorClient{logger: logger}
	orch := orchestrator.New(memStore, builder, operator, logger)
	h := handler.New(orch, logger)

	// --- HTTP Server ---
	mux := http.NewServeMux()

	// Health check.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// API routes.
	h.RegisterRoutes(mux)

	// Wrap with OTEL HTTP instrumentation.
	otelHandler := otelhttp.NewHandler(mux, "envmanager",
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
	)

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      otelHandler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// --- Graceful Shutdown ---
	errCh := make(chan error, 1)
	go func() {
		logger.Info("starting server", slog.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
		close(errCh)
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		logger.Info("received signal, shutting down", slog.String("signal", sig.String()))
	case err := <-errCh:
		if err != nil {
			logger.Error("server error", slog.String("error", err.Error()))
		}
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Info("server stopped")
}

// initTracer sets up an OTLP trace exporter.
// If OTEL_EXPORTER_OTLP_ENDPOINT is not set, it uses a no-op exporter.
func initTracer(ctx context.Context) (*sdktrace.TracerProvider, error) {
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
		),
	)
	if err != nil {
		return nil, err
	}

	// Only create OTLP exporter if endpoint is configured.
	endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if endpoint == "" {
		// No-op tracer provider (no exporter).
		tp := sdktrace.NewTracerProvider(
			sdktrace.WithResource(res),
		)
		otel.SetTracerProvider(tp)
		otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		))
		return tp, nil
	}

	// WithEndpoint expects host:port, not a URL with a scheme.
	endpoint = strings.TrimPrefix(endpoint, "https://")
	endpoint = strings.TrimPrefix(endpoint, "http://")
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(endpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp, nil
}

// --- Stub clients for builder and operator ---
// These will be replaced with real HTTP/gRPC clients when those services exist.

// stubBuilderClient is a no-op builder client for development.
type stubBuilderClient struct {
	logger *slog.Logger
}

func (s *stubBuilderClient) TriggerBuild(ctx context.Context, env model.Environment) (string, error) {
	s.logger.InfoContext(ctx, "stub: triggering build",
		slog.String("envId", env.ID),
		slog.String("envName", env.Name))
	return "stub-build-" + env.ID, nil
}

// stubOperatorClient is a no-op operator client for development.
type stubOperatorClient struct {
	logger *slog.Logger
}

func (s *stubOperatorClient) Deploy(ctx context.Context, env model.Environment, buildID string) (string, error) {
	s.logger.InfoContext(ctx, "stub: deploying",
		slog.String("envId", env.ID),
		slog.String("buildId", buildID))
	return "https://preview.localhost/" + env.ID, nil
}

func (s *stubOperatorClient) Teardown(ctx context.Context, envID string) error {
	s.logger.InfoContext(ctx, "stub: tearing down",
		slog.String("envId", envID))
	return nil
}
