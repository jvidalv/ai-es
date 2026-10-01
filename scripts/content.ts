import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import matter from "gray-matter";
import { marked, type Token } from "marked";
import sanitizeHtml from "sanitize-html";
import { postMetadata } from "../src/lib/content-schema.ts";
import { youtubeId } from "../src/lib/youtube.ts";
import type { ContentBlock } from "../src/lib/types.ts";

export async function parsePost({
  source,
  slug,
  today = new Date().toISOString().slice(0, 10),
}: {
  source: string;
  slug: string;
  today?: string;
}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  if (!/^---(?:yaml|yml)?[ \t]*\r?\n/.test(source)) {
    throw new Error(`Only YAML front matter is supported: ${slug}`);
  }
  const { data, content } = matter(source);
  const parsed = postMetadata.parse(data);
  if (parsed.draft || parsed.date > today) return null;
  if (!content.trim()) throw new Error(`Empty content: ${slug}`);
  const { draft: _draft, ...post } = parsed;
  const sanitize = (html: string) =>
    sanitizeHtml(html, {
      allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "width", "height", "loading", "decoding"],
      },
      allowedSchemes: ["https", "http", "mailto"],
      allowProtocolRelative: false,
      transformTags: {
        img: (tagName, attributes) => {
          if (!attributes.alt?.trim()) throw new Error(`Image needs alt text in ${slug}`);
          if (!attributes.src || !/^(?:https:\/\/|\/(?!\/))/.test(attributes.src)) {
            throw new Error(`Image must use HTTPS or a root-relative path in ${slug}`);
          }
          return { tagName, attribs: { ...attributes, loading: "lazy", decoding: "async" } };
        },
      },
    });
  const blocks: ContentBlock[] = [];
  const tokens = marked.lexer(content);
  let chunk: Token[] = [];
  let markdown = "";
  const flush = async () => {
    if (chunk.length)
      blocks.push({
        type: "html",
        html: sanitize(await marked.parser(Object.assign(chunk, { links: tokens.links }))),
      });
    chunk = [];
  };
  for (const token of tokens) {
    const match =
      token.type === "paragraph"
        ? /^::youtube\[([^\]\n]+)\]\(([^\s)]+)\)\s*$/.exec(token.raw)
        : null;
    if (match?.[1] && match[2]) {
      const id = youtubeId(match[2]);
      if (!id) throw new Error(`Invalid YouTube embed in ${slug}`);
      await flush();
      blocks.push({ type: "youtube", id, title: match[1] });
      markdown += `[Vídeo: ${match[1]}](https://www.youtube.com/watch?v=${id})\n\n`;
    } else {
      void marked.walkTokens([token], (nested) => {
        if (nested.type === "text" && nested.text.includes("::youtube")) {
          throw new Error(`YouTube embeds need their own paragraph in ${slug}`);
        }
      });
      chunk.push(token);
      markdown += token.raw;
    }
  }
  await flush();
  return {
    ...post,
    slug,
    blocks,
    markdown: markdown.trim(),
    minutes: Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200)),
  };
}

export async function generateContent() {
  const files = (await readdir("content/posts")).filter((file) => file.endsWith(".md")).sort();
  const entries = await Promise.all(
    files.map(async (file) => {
      try {
        return await parsePost({
          source: await readFile(`content/posts/${file}`, "utf8"),
          slug: file.slice(0, -3),
        });
      } catch (error) {
        throw new Error(`Invalid content in ${file}`, { cause: error });
      }
    }),
  );
  const posts = entries
    .filter((post) => post !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  await mkdir("src/generated", { recursive: true });
  await writeFile(
    "src/generated/content.ts",
    `// Generated from content/posts. Do not edit.\nimport type { Post } from '../lib/types';\nexport const posts: Post[] = ${JSON.stringify(posts, null, 2)};\n`,
  );
}
