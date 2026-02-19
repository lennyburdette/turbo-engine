import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "../app";

function renderApp(route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("renders the dashboard heading at /", () => {
    renderApp("/");
    const heading = screen.getByRole("heading", { name: "Dashboard" });
    expect(heading).toBeTruthy();
  });

  it("renders the sidebar navigation", () => {
    renderApp("/");
    // The sidebar contains the brand name and nav links
    expect(screen.getAllByText("Turbo Engine").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Packages").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Environments").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Builds").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the packages page at /packages", () => {
    renderApp("/packages");
    const heading = screen.getByRole("heading", { name: "Packages" });
    expect(heading).toBeTruthy();
    expect(screen.getByPlaceholderText("Search packages...")).toBeTruthy();
  });

  it("renders the environments page at /environments", () => {
    renderApp("/environments");
    const heading = screen.getByRole("heading", { name: "Environments" });
    expect(heading).toBeTruthy();
  });
});
