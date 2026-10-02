import { resolve, sep } from "node:path";
import { postsDirectory } from "@ai-es/content/loader";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { generateContent } from "./scripts/generate-content.ts";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "markdown-content",
      async configureServer(server) {
        await generateContent();
        server.watcher.add(postsDirectory);
        server.watcher.on("all", (event, file) => {
          if (
            ["add", "change", "unlink"].includes(event) &&
            resolve(file).startsWith(resolve(postsDirectory) + sep) &&
            file.endsWith(".md")
          ) {
            void generateContent().catch((error) => server.config.logger.error(String(error)));
          }
        });
      },
    },
  ],
});
