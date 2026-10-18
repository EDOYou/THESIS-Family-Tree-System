import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the build works from any folder or file server.
  base: "./",
  build: {
    // three.js alone is ~600 kB minified; one bundle is fine for a kiosk.
    chunkSizeWarningLimit: 1000,
  },
});
