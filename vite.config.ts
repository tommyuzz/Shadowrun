import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Shadowrun/",
  plugins: [react()],
  build: {
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true
  }
});
