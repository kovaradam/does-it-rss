/// <reference types="vitest/config" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin(), tailwindcss()],
  test: {
    includeSource: ["src/**/*.{ts,tsx}"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
