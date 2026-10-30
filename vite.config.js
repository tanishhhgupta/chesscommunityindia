import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { handlePublicApiRequest } from "./src/chesspair/lib/apiMiddleware.ts";
import { handleMediaApiRequest } from "./src/lib/media/mediaApiMiddleware.ts";

const chessPairApiPlugin = () => ({
  name: "chesspair-public-api-plugin",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      handleMediaApiRequest(req, res, () => {
        handlePublicApiRequest(req, res, next);
      });
    });
  },
});

export default defineConfig({
  plugins: [react(), chessPairApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ["**/*.zip", "**/dist/**", "**/.git/**"],
    },
  },
});
