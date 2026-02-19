# Build stage
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /src

# Cache dependencies.
COPY go.mod go.sum ./
RUN go mod download

# Build the binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/envmanager ./cmd/envmanager

# Runtime stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

# Run as non-root user.
RUN adduser -D -u 1000 appuser
USER appuser

COPY --from=builder /bin/envmanager /bin/envmanager

EXPOSE 8083

ENTRYPOINT ["/bin/envmanager"]
