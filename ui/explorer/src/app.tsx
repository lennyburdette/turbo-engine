import { useState, useEffect } from "react";
import { Compass, GitFork, ScrollText, Settings } from "lucide-react";
import { TabBar } from "./components/tab-bar";
import { ExploreTab } from "./tabs/explore";
import { GraphTab } from "./tabs/graph";
import { LogsTab } from "./tabs/logs";
import { SettingsTab } from "./tabs/settings";
import { setBaseUrl } from "./lib/api";
import type { Tab } from "./components/tab-bar";

const TABS: Tab[] = [
  { id: "explore", label: "Explore", icon: <Compass className="h-5 w-5" /> },
  { id: "graph", label: "Graph", icon: <GitFork className="h-5 w-5" /> },
  { id: "logs", label: "Logs", icon: <ScrollText className="h-5 w-5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

function TabContent({ tabId }: { tabId: string }) {
  switch (tabId) {
    case "explore":
      return <ExploreTab />;
    case "graph":
      return <GraphTab />;
    case "logs":
      return <LogsTab />;
    case "settings":
      return <SettingsTab />;
    default:
      return null;
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState("explore");

  // Restore persisted settings on mount
  useEffect(() => {
    try {
      const storedUrl = localStorage.getItem("explorer-api-url");
      if (storedUrl) setBaseUrl(storedUrl);

      const storedTheme = localStorage.getItem("explorer-theme");
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (storedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else if (
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        document.documentElement.classList.add("dark");
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* Scrollable content area — bottom padding accounts for the tab bar */}
      <main className="flex-1 px-4 pb-24 pt-4">
        <TabContent tabId={activeTab} />
      </main>

      {/* Bottom tab bar — fixed position */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
