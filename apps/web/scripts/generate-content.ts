import { mkdir, writeFile } from "node:fs/promises";
import { readPosts } from "@ai-es/content/loader";

export async function generateContent() {
  const posts = await readPosts();
  const directory = new URL("../src/generated/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL("content.ts", directory),
    `// Generated from packages/content/posts. Do not edit.\nimport type { Post } from '@ai-es/content/types';\nexport const posts: Post[] = ${JSON.stringify(posts, null, 2)};\n`,
  );
}

if (import.meta.main) await generateContent();
