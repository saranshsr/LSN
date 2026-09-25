import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  // Motion and the app must share one React instance, or hooks blow up.
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: { include: ["react", "react-dom", "react-dom/client", "motion/react"] },
});
