import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { copyFileSync, existsSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-htaccess-to-dist",
      closeBundle() {
        const src = path.resolve(__dirname, ".htaccess.dist");
        const dest = path.resolve(__dirname, "dist", ".htaccess");
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/health": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
});
