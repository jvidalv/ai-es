---
name: post-work-review
description: Audit ai-es changes against project rules, editorial voice, publishing and deployment contracts after implementation.
---

Read AGENTS.md and docs/writing-style.md. Review all changes in this logical task, including new files. Use parallel review agents for independent source and publishing/UI checks; report actionable findings and fix them in the same turn.

Check strict types, no re-exports, top-level imports, kebab-case source names, object parameters for 3+ arguments, concise comments, shared constants and useful regression tests. Use language-service navigation where available. Flag every violated project rule explicitly.

Check Markdown validation and sanitation, image alt text, YouTube host/id validation, click-to-load video privacy, publication dates and draft exclusion across every generated output. Check canonical URLs, distinct page metadata, HTML content without JavaScript, real 404 status, sitemap/RSS/LLM consistency and safe server paths.

Check light/dark contrast, small screens, keyboard controls, reduced motion, icon consistency, Spanish copy for a Spanish-speaking community, and the documented voice of equals. Verify README and writing instructions match the code.

Run `bun run check:push-gates` and `bun run build`, plus relevant browser tests. Fix regressions; do not change tests merely to match broken behavior. Do not apply Berrus game-engine, database, pixel-art, TypeBox or eleven-locale requirements to this static site.
