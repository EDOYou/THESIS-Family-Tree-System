import { defineConfig } from "vite";
import { familyFilePlugin } from "./familyFilePlugin";

export default defineConfig({
  // Relative asset paths so the build works from any folder or file server.
  base: "./",
  plugins: [familyFilePlugin()],
  build: {
    // three.js alone is ~600 kB minified; one bundle is fine for a kiosk.
    chunkSizeWarningLimit: 1000,
  },
});
