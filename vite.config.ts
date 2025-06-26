/// <reference types="vitest/config" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin()],
  test: {
    includeSource: ["src/**/*.{ts,tsx}"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
