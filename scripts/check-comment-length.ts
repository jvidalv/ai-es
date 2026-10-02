import { readFileSync } from "node:fs";
import { repoFiles } from "./check-shared.ts";

const MAX_LINES = 2;
const files = repoFiles().filter((file) => /\.(ts|tsx)$/.test(file));
const violations: { file: string; line: number; lines: number }[] = [];

for (const file of files) {
  const src = readFileSync(file, "utf8").split("\n");
  let blockStart = -1;
  let blockLen = 0;
  let inBlock = false;

  const flush = () => {
    if (blockLen > MAX_LINES) {
      violations.push({ file, line: blockStart + 1, lines: blockLen });
    }
    blockLen = 0;
    blockStart = -1;
  };

  for (let i = 0; i < src.length; i++) {
    const line = src[i].trim();

    if (inBlock) {
      blockLen++;
      if (line.includes("*/")) {
        inBlock = false;
        flush();
      }
      continue;
    }

    if (line.startsWith("/*")) {
      blockStart = i;
      blockLen = 1;
      if (!line.includes("*/")) inBlock = true;
      else flush();
      continue;
    }

    if (line.startsWith("//")) {
      if (blockStart === -1) blockStart = i;
      blockLen++;
      continue;
    }

    // A non-comment line ends any running `//` block.
    if (blockStart !== -1 && !inBlock) flush();
  }
  if (blockStart !== -1) flush();
}

if (violations.length > 0) {
  console.error("check:comment-length ✗ — comments over two lines:");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} (${v.lines} lines)`);
  }
  console.error("\nComments are scarce currency — trim to two lines or delete.");
  process.exit(1);
}

console.log(
  `check:comment-length ✓ — every comment across ${files.length} files is ≤ ${MAX_LINES} lines.`,
);
