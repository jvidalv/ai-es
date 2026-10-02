import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    plugins: ["react", "typescript", "oxc"],
    options: { typeAware: true, typeCheck: true },
    rules: { "react/rules-of-hooks": "error" },
  },
  test: { include: ["{apps,packages,scripts}/**/*.test.{ts,tsx}"] },
});
