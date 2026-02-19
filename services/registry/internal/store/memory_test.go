package store

import (
	"context"
	"errors"
	"testing"

	"github.com/lennyburdette/turbo-engine/services/registry/internal/model"
)

func seedPackage(name, version string) model.Package {
	return model.Package{
		Name:      name,
		Namespace: "default",
		Kind:      "graphql",
		Version:   version,
		Schema:    "type Query { hello: String }",
	}
}

func TestMemoryStore_Publish(t *testing.T) {
	tests := []struct {
		name    string
		pkgs    []model.Package
		wantErr error
	}{
		{
			name:    "publish new package succeeds",
			pkgs:    []model.Package{seedPackage("svc-a", "1.0.0")},
			wantErr: nil,
		},
		{
			name: "publish duplicate returns ErrAlreadyExists",
			pkgs: []model.Package{
				seedPackage("svc-a", "1.0.0"),
				seedPackage("svc-a", "1.0.0"),
			},
			wantErr: ErrAlreadyExists,
		},
		{
			name: "publish different versions succeeds",
			pkgs: []model.Package{
				seedPackage("svc-a", "1.0.0"),
				seedPackage("svc-a", "2.0.0"),
			},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := NewMemoryStore()
			ctx := context.Background()
			var err error
			var got model.Package
			for _, pkg := range tt.pkgs {
				got, err = s.Publish(ctx, pkg)
			}
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Publish() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				if got.ID == "" {
					t.Fatal("Publish() returned package with empty ID")
				}
				if got.CreatedAt.IsZero() {
					t.Fatal("Publish() returned package with zero CreatedAt")
				}
				if got.UpdatedAt.IsZero() {
					t.Fatal("Publish() returned package with zero UpdatedAt")
				}
			}
		})
	}
}

func TestMemoryStore_Get(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(s *MemoryStore)
		namespace string
		pkgName   string
		version   string
		wantErr   error
	}{
		{
			name: "get existing package",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
			},
			namespace: "default",
			pkgName:   "svc-a",
			version:   "1.0.0",
			wantErr:   nil,
		},
		{
			name:      "get non-existent returns ErrNotFound",
			setup:     func(s *MemoryStore) {},
			namespace: "default",
			pkgName:   "no-such-pkg",
			version:   "0.0.1",
			wantErr:   ErrNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := NewMemoryStore()
			tt.setup(s)
			got, err := s.Get(context.Background(), tt.namespace, tt.pkgName, tt.version)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Get() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr == nil && got.Name != tt.pkgName {
				t.Fatalf("Get() got name %q, want %q", got.Name, tt.pkgName)
			}
		})
	}
}

func TestMemoryStore_List(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(s *MemoryStore)
		req       model.ListPackagesRequest
		wantCount int
		wantToken bool
	}{
		{
			name:      "empty store returns empty list",
			setup:     func(s *MemoryStore) {},
			req:       model.ListPackagesRequest{},
			wantCount: 0,
			wantToken: false,
		},
		{
			name: "list all packages",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("svc-b", "1.0.0"))
			},
			req:       model.ListPackagesRequest{},
			wantCount: 2,
			wantToken: false,
		},
		{
			name: "filter by namespace",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
				pkg := seedPackage("svc-b", "1.0.0")
				pkg.Namespace = "other"
				_, _ = s.Publish(context.Background(), pkg)
			},
			req:       model.ListPackagesRequest{Namespace: "default"},
			wantCount: 1,
			wantToken: false,
		},
		{
			name: "filter by kind",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
				pkg := seedPackage("svc-b", "1.0.0")
				pkg.Kind = "rest"
				_, _ = s.Publish(context.Background(), pkg)
			},
			req:       model.ListPackagesRequest{Kind: "graphql"},
			wantCount: 1,
			wantToken: false,
		},
		{
			name: "filter by name prefix",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("users-api", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("users-web", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("orders-api", "1.0.0"))
			},
			req:       model.ListPackagesRequest{NamePrefix: "users"},
			wantCount: 2,
			wantToken: false,
		},
		{
			name: "pagination with page size",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("svc-b", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("svc-c", "1.0.0"))
			},
			req:       model.ListPackagesRequest{PageSize: 2},
			wantCount: 2,
			wantToken: true,
		},
		{
			name: "pagination second page",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("svc-b", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("svc-c", "1.0.0"))
			},
			req:       model.ListPackagesRequest{PageSize: 2, PageToken: "2"},
			wantCount: 1,
			wantToken: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := NewMemoryStore()
			tt.setup(s)
			resp, err := s.List(context.Background(), tt.req)
			if err != nil {
				t.Fatalf("List() unexpected error: %v", err)
			}
			if len(resp.Packages) != tt.wantCount {
				t.Fatalf("List() returned %d packages, want %d", len(resp.Packages), tt.wantCount)
			}
			hasToken := resp.NextPageToken != ""
			if hasToken != tt.wantToken {
				t.Fatalf("List() nextPageToken=%q, wantToken=%v", resp.NextPageToken, tt.wantToken)
			}
		})
	}
}

func TestMemoryStore_Yank(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(s *MemoryStore)
		namespace string
		pkgName   string
		version   string
		wantErr   error
	}{
		{
			name: "yank existing package",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
			},
			namespace: "default",
			pkgName:   "svc-a",
			version:   "1.0.0",
			wantErr:   nil,
		},
		{
			name:      "yank non-existent returns ErrNotFound",
			setup:     func(s *MemoryStore) {},
			namespace: "default",
			pkgName:   "ghost",
			version:   "0.0.1",
			wantErr:   ErrNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := NewMemoryStore()
			tt.setup(s)
			err := s.Yank(context.Background(), tt.namespace, tt.pkgName, tt.version)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Yank() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				pkg, _ := s.Get(context.Background(), tt.namespace, tt.pkgName, tt.version)
				if !pkg.Yanked {
					t.Fatal("Yank() did not set Yanked=true")
				}
			}
		})
	}
}

func TestMemoryStore_Resolve(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(s *MemoryStore)
		namespace string
		pkgName   string
		version   string
		wantCount int
		wantErr   error
	}{
		{
			name:      "resolve non-existent returns ErrNotFound",
			setup:     func(s *MemoryStore) {},
			namespace: "default",
			pkgName:   "ghost",
			version:   "1.0.0",
			wantCount: 0,
			wantErr:   ErrNotFound,
		},
		{
			name: "resolve package with no dependencies",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("svc-a", "1.0.0"))
			},
			namespace: "default",
			pkgName:   "svc-a",
			version:   "1.0.0",
			wantCount: 0,
			wantErr:   nil,
		},
		{
			name: "resolve package with direct dependencies",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("dep-a", "1.0.0"))
				_, _ = s.Publish(context.Background(), seedPackage("dep-b", "2.0.0"))
				pkg := seedPackage("root", "1.0.0")
				pkg.Dependencies = []model.Dependency{
					{PackageName: "dep-a", VersionConstraint: "1.0.0"},
					{PackageName: "dep-b", VersionConstraint: "2.0.0"},
				}
				_, _ = s.Publish(context.Background(), pkg)
			},
			namespace: "default",
			pkgName:   "root",
			version:   "1.0.0",
			wantCount: 2,
			wantErr:   nil,
		},
		{
			name: "resolve transitive dependencies",
			setup: func(s *MemoryStore) {
				_, _ = s.Publish(context.Background(), seedPackage("leaf", "1.0.0"))
				mid := seedPackage("mid", "1.0.0")
				mid.Dependencies = []model.Dependency{
					{PackageName: "leaf", VersionConstraint: "1.0.0"},
				}
				_, _ = s.Publish(context.Background(), mid)
				root := seedPackage("root", "1.0.0")
				root.Dependencies = []model.Dependency{
					{PackageName: "mid", VersionConstraint: "1.0.0"},
				}
				_, _ = s.Publish(context.Background(), root)
			},
			namespace: "default",
			pkgName:   "root",
			version:   "1.0.0",
			wantCount: 2, // mid + leaf
			wantErr:   nil,
		},
		{
			name: "resolve handles circular dependencies without infinite loop",
			setup: func(s *MemoryStore) {
				a := seedPackage("a", "1.0.0")
				a.Dependencies = []model.Dependency{
					{PackageName: "b", VersionConstraint: "1.0.0"},
				}
				b := seedPackage("b", "1.0.0")
				b.Dependencies = []model.Dependency{
					{PackageName: "a", VersionConstraint: "1.0.0"},
				}
				_, _ = s.Publish(context.Background(), a)
				_, _ = s.Publish(context.Background(), b)
			},
			namespace: "default",
			pkgName:   "a",
			version:   "1.0.0",
			wantCount: 1, // only b (a is the root and already visited)
			wantErr:   nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := NewMemoryStore()
			tt.setup(s)
			got, err := s.Resolve(context.Background(), tt.namespace, tt.pkgName, tt.version)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Resolve() error = %v, wantErr %v", err, tt.wantErr)
			}
			if len(got) != tt.wantCount {
				t.Fatalf("Resolve() returned %d packages, want %d", len(got), tt.wantCount)
			}
		})
	}
}
