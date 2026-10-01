import { describe, expect, it } from "vite-plus/test";
import { parsePost } from "./content.ts";
import { youtubeId } from "../src/lib/youtube.ts";

const source = (extra = "", body = "Un artículo de prueba.") =>
  `---\ntitle: Prueba\ndescription: Una descripción\ndate: "2026-01-01"\nkind: articulo\ntopic: ia\nicon: "03"\n${extra}---\n${body}`;
describe("public content boundary", () => {
  it("keeps drafts and future publications out of the generated site", async () => {
    expect(await parsePost({ source: source("draft: true\n"), slug: "borrador" })).toBeNull();
    expect(await parsePost({ source: source(), slug: "futuro", today: "2025-01-01" })).toBeNull();
  });
  it("rejects invalid metadata before a broken post can deploy", async () => {
    await expect(
      parsePost({ source: source().replace("2026-01-01", "2026-02-31"), slug: "invalido" }),
    ).rejects.toThrow();
    await expect(
      parsePost({ source: source().replace("kind: articulo", "kind: video"), slug: "sin-url" }),
    ).rejects.toThrow();
    await expect(parsePost({ source: source(), slug: "../outside" })).rejects.toThrow();
  });
  it("removes scripts, event handlers and unsafe links from article HTML", async () => {
    const post = await parsePost({
      source: source(
        "",
        '<script>alert(1)</script><img src="/image.png" alt="Una imagen" onerror="alert(1)"><a href="javascript:alert(1)">link</a>',
      ),
      slug: "seguro",
    });
    const serialized = JSON.stringify(post?.blocks);
    expect(serialized).not.toContain("<script");
    expect(serialized).not.toContain("onerror");
    expect(serialized).not.toContain("javascript:");
    expect(serialized).toContain("/image.png");
  });
  it("creates lazy video blocks while preserving images and fenced code", async () => {
    const directive = "::youtube[Una charla](https://youtu.be/tK2ACXUGcrY)";
    const post = await parsePost({
      source: source(
        "",
        `![Una imagen](/images/test.png)\n\n${directive}\n\n\`\`\`md\n${directive}\n\`\`\``,
      ),
      slug: "media",
    });
    expect(post?.blocks.filter((block) => block.type === "youtube")).toEqual([
      { type: "youtube", id: "tK2ACXUGcrY", title: "Una charla" },
    ]);
    expect(JSON.stringify(post?.blocks)).toContain("<pre><code");
    expect(JSON.stringify(post?.blocks)).toContain("/images/test.png");
  });
  it("rejects lookalike hosts and malformed video identifiers", () => {
    expect(youtubeId("https://youtube.com.evil.example/watch?v=tK2ACXUGcrY")).toBeNull();
    expect(youtubeId("javascript:alert(1)")).toBeNull();
    expect(youtubeId("https://youtu.be/invalid")).toBeNull();
    expect(youtubeId("https://www.youtube.com/watch?v=tK2ACXUGcrY&t=30")).toBe("tK2ACXUGcrY");
  });
});

describe("authoring mistakes", () => {
  it("rejects misspelled draft flags and executable front matter", async () => {
    await expect(
      parsePost({ source: source("drafts: true\n"), slug: "draft-typo" }),
    ).rejects.toThrow();
    await expect(
      parsePost({ source: "---js\n({title:'Executable'})\n---\nBody", slug: "executable" }),
    ).rejects.toThrow("Only YAML");
  });
  it("requires descriptive alt text and secure image sources", async () => {
    for (const body of [
      "![](/image.png)",
      "![Image](http://example.com/image.png)",
      "![Image](//example.com/image.png)",
    ]) {
      await expect(
        parsePost({ source: source("", body), slug: "invalid-image" }),
      ).rejects.toThrow();
    }
  });
  it("rejects misplaced embeds instead of silently publishing the directive", async () => {
    for (const body of [
      "> ::youtube[Talk](https://youtu.be/tK2ACXUGcrY)",
      "::youtube[Talk](https://youtu.be/tK2ACXUGcrY) more text",
    ]) {
      await expect(
        parsePost({ source: source("", body), slug: "invalid-embed" }),
      ).rejects.toThrow();
    }
  });
  it("keeps reference links working across video blocks", async () => {
    const post = await parsePost({
      source: source(
        "",
        "[Docs][ref]\n\n::youtube[Talk](https://youtu.be/tK2ACXUGcrY)\n\n[ref]: https://example.com/docs\n",
      ),
      slug: "references",
    });
    expect(JSON.stringify(post?.blocks)).toContain("https://example.com/docs");
    expect(post?.markdown).toContain("[ref]: https://example.com/docs");
  });
});
