package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"service":   "turbo-engine-echo",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"method":    r.Method,
			"path":      r.URL.Path,
			"query":     r.URL.RawQuery,
			"host":      r.Host,
			"headers": map[string]string{
				"x-forwarded-for":   r.Header.Get("X-Forwarded-For"),
				"x-forwarded-host":  r.Header.Get("X-Forwarded-Host"),
				"x-forwarded-proto": r.Header.Get("X-Forwarded-Proto"),
				"x-request-id":      r.Header.Get("X-Request-Id"),
			},
		})
	})

	fmt.Printf("echo-server listening on :%s\n", port)
	http.ListenAndServe(":"+port, mux)
}
