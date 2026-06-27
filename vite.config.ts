import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});