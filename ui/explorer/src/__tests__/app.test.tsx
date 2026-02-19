import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "../app";

// Mock window.matchMedia for jsdom (used by theme detection)
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock fetch globally so react-query requests resolve immediately
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ packages: [], environments: [] }),
        text: () => Promise.resolve(""),
      }),
    ),
  );
});

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("renders the Explore tab by default", () => {
    renderApp();
    const heading = screen.getByRole("heading", { name: "Explore" });
    expect(heading).toBeTruthy();
  });

  it("renders the bottom tab bar with all four tabs", () => {
    renderApp();
    expect(screen.getByRole("tab", { name: "Explore" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Graph" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Logs" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Settings" })).toBeTruthy();
  });

  it("switches to Graph tab when tapped", async () => {
    renderApp();
    fireEvent.click(screen.getByRole("tab", { name: "Graph" }));
    // Graph tab shows a heading after the query resolves
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Graph" })).toBeTruthy();
    });
  });

  it("switches to Logs tab when tapped", () => {
    renderApp();
    fireEvent.click(screen.getByRole("tab", { name: "Logs" }));
    expect(screen.getByRole("heading", { name: "Logs" })).toBeTruthy();
  });

  it("switches to Settings tab when tapped", async () => {
    renderApp();
    fireEvent.click(screen.getByRole("tab", { name: "Settings" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
    });
  });

  it("marks the active tab as selected", () => {
    renderApp();
    const exploreTab = screen.getByRole("tab", { name: "Explore" });
    expect(exploreTab.getAttribute("aria-selected")).toBe("true");

    const graphTab = screen.getByRole("tab", { name: "Graph" });
    expect(graphTab.getAttribute("aria-selected")).toBe("false");
  });
});
