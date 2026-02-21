FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY main.go .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o petstore-mock main.go

FROM alpine:3.20
COPY --from=build /app/petstore-mock /petstore-mock
EXPOSE 8080
ENTRYPOINT ["/petstore-mock"]
