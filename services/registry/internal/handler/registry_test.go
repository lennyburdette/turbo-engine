package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/lennyburdette/turbo-engine/services/registry/internal/model"
	"github.com/lennyburdette/turbo-engine/services/registry/internal/store"
)

func newTestServer() (*httptest.Server, *store.MemoryStore) {
	s := store.NewMemoryStore()
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	h := New(s, logger)
	return httptest.NewServer(h), s
}

func mustMarshal(t *testing.T, v any) []byte {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return b
}

func TestPublishPackage(t *testing.T) {
	tests := []struct {
		name       string
		body       any
		wantStatus int
	}{
		{
			name: "successful publish",
			body: model.PublishRequest{
				Package: model.Package{
					Name:      "svc-a",
					Namespace: "default",
					Kind:      "graphql",
					Version:   "1.0.0",
					Schema:    "type Query { hello: String }",
				},
			},
			wantStatus: http.StatusCreated,
		},
		{
			name:       "invalid JSON body",
			body:       "not json{{{",
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "missing name",
			body: model.PublishRequest{
				Package: model.Package{
					Version: "1.0.0",
				},
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "missing version",
			body: model.PublishRequest{
				Package: model.Package{
					Name: "svc-a",
				},
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, _ := newTestServer()
			defer ts.Close()

			var body []byte
			switch v := tt.body.(type) {
			case string:
				body = []byte(v)
			default:
				body = mustMarshal(t, v)
			}

			resp, err := http.Post(ts.URL+"/v1/packages", "application/json", bytes.NewReader(body))
			if err != nil {
				t.Fatalf("POST /v1/packages: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				b, _ := io.ReadAll(resp.Body)
				t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, tt.wantStatus, b)
			}

			if tt.wantStatus == http.StatusCreated {
				var pkg model.Package
				if err := json.NewDecoder(resp.Body).Decode(&pkg); err != nil {
					t.Fatalf("decode response: %v", err)
				}
				if pkg.ID == "" {
					t.Fatal("expected non-empty ID in response")
				}
				if pkg.Name != "svc-a" {
					t.Fatalf("name = %q, want %q", pkg.Name, "svc-a")
				}
			}
		})
	}
}

func TestPublishPackage_Conflict(t *testing.T) {
	ts, _ := newTestServer()
	defer ts.Close()

	body := mustMarshal(t, model.PublishRequest{
		Package: model.Package{
			Name:      "svc-a",
			Namespace: "default",
			Version:   "1.0.0",
		},
	})

	// First publish should succeed.
	resp, err := http.Post(ts.URL+"/v1/packages", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("first publish: status = %d, want %d", resp.StatusCode, http.StatusCreated)
	}

	// Second publish of the same version should conflict.
	resp, err = http.Post(ts.URL+"/v1/packages", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("duplicate publish: status = %d, want %d", resp.StatusCode, http.StatusConflict)
	}
}

func TestGetPackage(t *testing.T) {
	tests := []struct {
		name       string
		setup      bool
		url        string
		wantStatus int
	}{
		{
			name:       "get existing package",
			setup:      true,
			url:        "/v1/packages/svc-a/versions/1.0.0?namespace=default",
			wantStatus: http.StatusOK,
		},
		{
			name:       "get with default namespace",
			setup:      true,
			url:        "/v1/packages/svc-a/versions/1.0.0",
			wantStatus: http.StatusOK,
		},
		{
			name:       "get non-existent returns 404",
			setup:      false,
			url:        "/v1/packages/ghost/versions/0.0.1",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, s := newTestServer()
			defer ts.Close()

			if tt.setup {
				_, _ = s.Publish(nil, model.Package{
					Name:      "svc-a",
					Namespace: "default",
					Kind:      "graphql",
					Version:   "1.0.0",
					Schema:    "type Query { hello: String }",
				})
			}

			resp, err := http.Get(ts.URL + tt.url)
			if err != nil {
				t.Fatalf("GET %s: %v", tt.url, err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tt.wantStatus)
			}
		})
	}
}

func TestListPackages(t *testing.T) {
	tests := []struct {
		name       string
		setup      func(s *store.MemoryStore)
		query      string
		wantCount  int
		wantStatus int
	}{
		{
			name:       "empty store",
			setup:      func(s *store.MemoryStore) {},
			query:      "",
			wantCount:  0,
			wantStatus: http.StatusOK,
		},
		{
			name: "list all",
			setup: func(s *store.MemoryStore) {
				_, _ = s.Publish(nil, model.Package{Name: "a", Namespace: "default", Version: "1.0.0"})
				_, _ = s.Publish(nil, model.Package{Name: "b", Namespace: "default", Version: "1.0.0"})
			},
			query:      "",
			wantCount:  2,
			wantStatus: http.StatusOK,
		},
		{
			name: "filter by namespace",
			setup: func(s *store.MemoryStore) {
				_, _ = s.Publish(nil, model.Package{Name: "a", Namespace: "prod", Version: "1.0.0"})
				_, _ = s.Publish(nil, model.Package{Name: "b", Namespace: "dev", Version: "1.0.0"})
			},
			query:      "?namespace=prod",
			wantCount:  1,
			wantStatus: http.StatusOK,
		},
		{
			name: "pagination",
			setup: func(s *store.MemoryStore) {
				_, _ = s.Publish(nil, model.Package{Name: "a", Namespace: "default", Version: "1.0.0"})
				_, _ = s.Publish(nil, model.Package{Name: "b", Namespace: "default", Version: "1.0.0"})
				_, _ = s.Publish(nil, model.Package{Name: "c", Namespace: "default", Version: "1.0.0"})
			},
			query:      "?page_size=2",
			wantCount:  2,
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, s := newTestServer()
			defer ts.Close()
			tt.setup(s)

			resp, err := http.Get(ts.URL + "/v1/packages" + tt.query)
			if err != nil {
				t.Fatalf("GET /v1/packages: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tt.wantStatus)
			}

			var body model.ListPackagesResponse
			if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
				t.Fatalf("decode: %v", err)
			}
			if len(body.Packages) != tt.wantCount {
				t.Fatalf("count = %d, want %d", len(body.Packages), tt.wantCount)
			}
		})
	}
}

func TestYankPackage(t *testing.T) {
	tests := []struct {
		name       string
		setup      bool
		url        string
		wantStatus int
	}{
		{
			name:       "yank existing package",
			setup:      true,
			url:        "/v1/packages/svc-a/versions/1.0.0?namespace=default",
			wantStatus: http.StatusNoContent,
		},
		{
			name:       "yank non-existent returns 404",
			setup:      false,
			url:        "/v1/packages/ghost/versions/0.0.1",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, s := newTestServer()
			defer ts.Close()

			if tt.setup {
				_, _ = s.Publish(nil, model.Package{
					Name:      "svc-a",
					Namespace: "default",
					Version:   "1.0.0",
				})
			}

			req, _ := http.NewRequest(http.MethodDelete, ts.URL+tt.url, nil)
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("DELETE %s: %v", tt.url, err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tt.wantStatus)
			}
		})
	}
}

func TestResolveDependencies(t *testing.T) {
	tests := []struct {
		name       string
		setup      func(s *store.MemoryStore)
		url        string
		wantCount  int
		wantStatus int
	}{
		{
			name:       "resolve non-existent returns 404",
			setup:      func(s *store.MemoryStore) {},
			url:        "/v1/packages/ghost/versions/1.0.0/dependencies",
			wantStatus: http.StatusNotFound,
			wantCount:  0,
		},
		{
			name: "resolve package with dependencies",
			setup: func(s *store.MemoryStore) {
				_, _ = s.Publish(nil, model.Package{
					Name: "dep-a", Namespace: "default", Version: "1.0.0",
				})
				_, _ = s.Publish(nil, model.Package{
					Name:      "root",
					Namespace: "default",
					Version:   "1.0.0",
					Dependencies: []model.Dependency{
						{PackageName: "dep-a", VersionConstraint: "1.0.0"},
					},
				})
			},
			url:        "/v1/packages/root/versions/1.0.0/dependencies?namespace=default",
			wantStatus: http.StatusOK,
			wantCount:  1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, s := newTestServer()
			defer ts.Close()
			tt.setup(s)

			resp, err := http.Get(ts.URL + tt.url)
			if err != nil {
				t.Fatalf("GET %s: %v", tt.url, err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tt.wantStatus)
			}

			if tt.wantStatus == http.StatusOK {
				var body model.ResolveDependenciesResponse
				if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
					t.Fatalf("decode: %v", err)
				}
				if len(body.Packages) != tt.wantCount {
					t.Fatalf("count = %d, want %d", len(body.Packages), tt.wantCount)
				}
			}
		})
	}
}
