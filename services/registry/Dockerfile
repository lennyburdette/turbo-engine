# --- Build stage ---
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /src

# Cache dependency downloads.
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build a statically-linked binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /bin/registry ./cmd/registry

# --- Runtime stage ---
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /bin/registry /registry

EXPOSE 8081

USER nonroot:nonroot

ENTRYPOINT ["/registry"]
