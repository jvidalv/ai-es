import { readFileSync } from "node:fs";
import { changedFiles, repoRelative } from "./check-shared.ts";

const MAX_RATIO = 0.2;
const MIN_CODE_LINES = 15;

function measure(file: string): { code: number; comment: number } {
  const src = readFileSync(file, "utf8").split("\n");
  let code = 0;
  let comment = 0;
  let inBlock = false;
  for (const raw of src) {
    const line = raw.trim();
    if (!line) continue;
    if (inBlock) {
      comment++;
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.startsWith("/*")) {
      comment++;
      if (!line.includes("*/")) inBlock = true;
      continue;
    }
    if (line.startsWith("//")) {
      comment++;
      continue;
    }
    code++;
  }
  return { code, comment };
}

const violations: {
  file: string;
  code: number;
  comment: number;
  ratio: number;
}[] = [];

for (const file of changedFiles({ match: /\.(ts|tsx)$/ })) {
  let stats;
  try {
    stats = measure(file);
  } catch {
    continue;
  }
  if (stats.code < MIN_CODE_LINES) continue;
  const ratio = stats.comment / stats.code;
  if (ratio > MAX_RATIO) {
    violations.push({ file, ...stats, ratio });
  }
}

if (violations.length > 0) {
  violations.sort((a, b) => b.ratio - a.ratio);
  console.error("check:comment-density ✗ — changed files with too many comments:");
  for (const v of violations) {
    console.error(
      `  ${repoRelative(v.file)} — ${v.comment} comment / ${v.code} code lines (ratio ${v.ratio.toFixed(2)}, cap ${MAX_RATIO})`,
    );
  }
  console.error(
    "\nThe code is typed. Delete comments that restate a name, type, or the line" +
      "\nbelow them (a `turnsToMs` call needs no // it's in turns). Keep only a" +
      "\nnon-obvious why.",
  );
  process.exit(1);
}

console.log("check:comment-density ✓ — changed files stay lean on comments.");
