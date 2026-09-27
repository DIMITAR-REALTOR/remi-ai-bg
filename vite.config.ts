import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart()],
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
