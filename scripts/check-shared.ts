import { execFileSync } from "node:child_process";
import { existsSync, globSync } from "node:fs";
import { relative } from "node:path";

export function repoRelative(file: string): string {
  return relative(".", file).replaceAll("\\", "/");
}
export function repoFiles(): string[] {
  return [
    ...new Set(
      execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
        encoding: "utf8",
      }).split("\0"),
    ),
  ].filter((file) => file && existsSync(file));
}
export function repoGlob(pattern: string): string[] {
  return globSync(pattern).map(repoRelative);
}
export function changedFiles({ match = /\.(ts|tsx)$/ }: { match?: RegExp } = {}): string[] {
  const files = new Set<string>();
  const commands = [
    ["diff", "--name-only", "--diff-filter=d", "-z", "HEAD"],
    ["ls-files", "--others", "--exclude-standard", "-z"],
    ["diff", "--cached", "--name-only", "--diff-filter=d", "-z"],
  ];
  try {
    const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    commands.push(["diff", "--name-only", "--diff-filter=d", "-z", `${base}...HEAD`]);
  } catch {
    /* A new repository has no remote base yet. */
  }
  for (const args of commands) {
    try {
      for (const file of execFileSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).split("\0"))
        if (file && existsSync(file) && match.test(file)) files.add(file);
    } catch {
      /* Before the first commit, all source files are untracked. */
    }
  }
  return [...files];
}
