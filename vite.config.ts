// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

const enableMcp = process.env.ENABLE_MCP === "true";

export default defineConfig({
  plugins: enableMcp ? [mcpPlugin()] : [],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // REMI Voice Input v1 — src/lib/voice/whisper-worker.ts is loaded as a
    // client-only ES module Worker (Whisper WASM inference). Never runs
    // server-side / in SSR — this only affects how the browser bundle for
    // that worker chunk is built.
    worker: { format: "es" },
    optimizeDeps: { exclude: ["@huggingface/transformers"] },
  },
});
