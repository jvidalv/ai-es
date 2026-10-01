import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { generateContent } from "./scripts/content.ts";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "markdown-content",
      async configureServer(server) {
        await generateContent();
        server.watcher.add("content/posts");
        server.watcher.on("all", (event, file) => {
          if (
            ["add", "change", "unlink"].includes(event) &&
            file.includes("content/posts/") &&
            file.endsWith(".md")
          ) {
            void generateContent().catch((error) => server.config.logger.error(String(error)));
          }
        });
      },
    },
  ],
  lint: {
    plugins: ["react", "typescript", "oxc"],
    options: { typeAware: true, typeCheck: true },
    rules: { "react/rules-of-hooks": "error" },
  },
  test: { include: ["scripts/**/*.test.ts"] },
});
