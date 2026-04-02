import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const proxyTarget = env.PROXY_TARGET || "http://127.0.0.1:3000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: ["cashball.namek.link"],
      host: true,
      watch: {
        usePolling: true,
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/socket.io": {
          target: proxyTarget,
          ws: true,
        },
      },
    },
  };
});
