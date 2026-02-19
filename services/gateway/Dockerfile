# Stage 1: Build
FROM rust:1.83-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependency builds: copy manifests first, create a dummy main, build
# dependencies, then copy the real source and rebuild.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release && rm -rf src

# Copy real source and rebuild (only the gateway binary is recompiled).
COPY src/ src/
COPY tests/ tests/
RUN touch src/main.rs && cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Run as non-root.
RUN useradd --create-home --uid 1000 gateway
USER gateway

COPY --from=builder /app/target/release/gateway /usr/local/bin/gateway

EXPOSE 8080

ENTRYPOINT ["gateway"]
