import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain client-only SPA config used by `vite dev` and `vite build`.
// The `@/*` alias is resolved from tsconfig.json by vite-tsconfig-paths.
// The production build deployed to cPanel is produced by vite.static.config.ts
// (`npm run build:static` → dist-static/).
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  publicDir: "public",
});
