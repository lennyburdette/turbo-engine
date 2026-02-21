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

  it("renders the Topology panel header", async () => {
    renderApp();
    // The topology panel header shows "Topology" as text
    await waitFor(() => {
      expect(screen.getByText("Topology")).toBeTruthy();
    });
  });

  it("renders bottom panel tab buttons", () => {
    renderApp();
    // The bottom panel bar has buttons with text
    const buttons = screen.getAllByRole("button");
    const tabLabels = buttons.map((b) => b.textContent);
    expect(tabLabels).toContain("Traces");
    expect(tabLabels).toContain("Inspector");
    expect(tabLabels).toContain("Request");
  });

  it("shows Traces panel by default with loading state", async () => {
    renderApp();
    // The trace panel shows a loading indicator initially
    await waitFor(() => {
      expect(screen.getByText("Loading traces...")).toBeTruthy();
    });
  });

  it("switches to Inspector panel when clicked", async () => {
    renderApp();
    const inspectorButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "Inspector");
    if (inspectorButton) fireEvent.click(inspectorButton);
    await waitFor(() => {
      expect(screen.getByText(/Select a service/)).toBeTruthy();
    });
  });

  it("switches to Request panel when clicked", async () => {
    renderApp();
    const requestButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "Request");
    if (requestButton) fireEvent.click(requestButton);
    await waitFor(() => {
      expect(screen.getByText("Send")).toBeTruthy();
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
});
