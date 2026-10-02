import assert from "node:assert/strict";
import { globSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { posts } from "../src/generated/content.ts";
import { postPath, site } from "../src/lib/site.ts";

const htmlFiles = globSync("dist/**/*.html");
assert.ok(htmlFiles.length > 1, "Expected pre-rendered pages");
const titles = new Set<string>();
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  assert.ok(title, `${file}: missing title`);
  assert.ok(!titles.has(title), `${file}: duplicate title`);
  titles.add(title);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, `${file}: expected one H1`);
  assert.ok(html.includes('name="description"'), `${file}: missing description`);
  if (file.endsWith("404.html")) assert.ok(html.includes("noindex"));
  else {
    assert.ok(html.includes('rel="canonical"'), `${file}: missing canonical`);
    assert.ok(existsSync(join(dirname(file), "index.md")), `${file}: missing Markdown`);
  }
  const socialImage = /property="og:image" content="([^"]+)"/.exec(html)?.[1];
  assert.ok(socialImage, `${file}: missing social image`);
  const imageUrl = new URL(socialImage);
  assert.equal(imageUrl.origin, site.origin, `${file}: unexpected social image origin`);
  const imageBytes = readFileSync(join("dist", imageUrl.pathname));
  assert.equal(imageBytes.subarray(1, 4).toString(), "PNG", `${file}: social image is not PNG`);
  const width = Number(/property="og:image:width" content="(\d+)"/.exec(html)?.[1]);
  const height = Number(/property="og:image:height" content="(\d+)"/.exec(html)?.[1]);
  assert.equal(imageBytes.readUInt32BE(16), width, `${file}: social image width mismatch`);
  assert.equal(imageBytes.readUInt32BE(20), height, `${file}: social image height mismatch`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
    const url = match[1];
    if (!url || url.startsWith("//")) continue;
    const path = resolve("dist", `.${url}`);
    assert.ok(existsSync(path), `${file}: broken internal link or asset ${url}`);
  }
}
const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const llms = readFileSync("dist/llms-full.txt", "utf8");
const feed = readFileSync("dist/feed.xml", "utf8");
const llmsIndex = readFileSync("dist/llms.txt", "utf8");
for (const post of posts) {
  const url = `${site.origin}${postPath(post)}`;
  assert.ok(sitemap.includes(url), `${url} absent from sitemap`);
  assert.ok(llms.includes(url), `${url} absent from LLM content`);
  assert.ok(feed.includes(url), `${url} absent from RSS`);
  assert.ok(llmsIndex.includes(`${url}index.md`), `${url} absent from LLM index`);
}
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = new URL(match[1]);
  assert.equal(url.origin, site.origin, "Unexpected sitemap origin");
  assert.ok(existsSync(join("dist", url.pathname, "index.html")), `${url}: missing HTML`);
}
assert.ok(!sitemap.includes("404.html"), "404 must not be indexed");
console.log(
  `Verified ${htmlFiles.length} HTML files, internal targets, metadata, Markdown and feeds.`,
);
