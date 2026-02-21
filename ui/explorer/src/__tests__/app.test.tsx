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
        json: () =>
          Promise.resolve({ packages: [], environments: [], data: [] }),
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
  it("renders the header with app title", () => {
    renderApp();
    expect(screen.getByText("Turbo Engine Explorer")).toBeTruthy();
  });

  it("renders the Recent Traces card", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Recent Traces")).toBeTruthy();
    });
  });

  it("renders the Send Request card", () => {
    renderApp();
    expect(screen.getByText("Send Request")).toBeTruthy();
  });

  it("renders the View all traces link", () => {
    renderApp();
    expect(screen.getByText("View all")).toBeTruthy();
  });

  it("shows loading state for traces", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Loading traces...")).toBeTruthy();
    });
  });

  it("opens settings overlay when gear icon is clicked", async () => {
    renderApp();
    const header = screen.getByText("Turbo Engine Explorer").closest("header");
    const settingsButton = header?.querySelector("button");
    if (settingsButton) {
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeTruthy();
        expect(screen.getByText("Done")).toBeTruthy();
      });
    }
  });

  it("shows empty state when no traces are found", async () => {
    renderApp();
    await waitFor(() => {
      expect(
        screen.getByText("No traces yet. Send a request to see traces here."),
      ).toBeTruthy();
    });
  });
});
