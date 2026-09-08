import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const base = process.env.BASE_PATH || "/";

/** GitHub Pages SPA fallback: unknown paths serve index.html */
function spaFallback404(): Plugin {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const index = resolve(dist, "index.html");
      const fallback = resolve(dist, "404.html");
      if (existsSync(index)) {
        copyFileSync(index, fallback);
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback404()],
  server: {
    port: 5173,
  },
});
