# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM golang:1.23-alpine AS build

RUN apk add --no-cache ca-certificates git

WORKDIR /src

# Cache module downloads.
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /bin/builder ./cmd/builder

# ---- Runtime stage ----
FROM alpine:3.20 AS runtime

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S builder && adduser -S builder -G builder

COPY --from=build /bin/builder /usr/local/bin/builder

USER builder

EXPOSE 8082

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--tries=1", "--spider", "http://localhost:8082/healthz"]

ENTRYPOINT ["builder"]
