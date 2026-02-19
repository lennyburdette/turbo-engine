import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api/registry": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/registry/, ""),
      },
      "/api/builder": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/builder/, ""),
      },
      "/api/envmanager": {
        target: "http://localhost:8083",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/envmanager/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: false,
  },
});
