import { execFileSync, spawnSync } from "node:child_process";
const files = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=d", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter((file) => /\.(ts|tsx|css|json|md|html|ya?ml)$/.test(file));
for (const file of files) {
  const staged = execFileSync("git", ["show", `:${file}`], { encoding: "utf8" });
  const formatted = spawnSync("./node_modules/.bin/vp", ["fmt", "--stdin-filepath", file], {
    input: staged,
    encoding: "utf8",
  });
  if (formatted.status !== 0 || formatted.stdout !== staged) {
    console.error(`${file}: staged contents need formatting`, formatted.stderr);
    process.exit(1);
  }
}
const sourceFiles = files.filter((file) => /\.(ts|tsx)$/.test(file));
if (sourceFiles.length) {
  const lint = spawnSync("vp", ["lint", "--deny-warnings", ...sourceFiles], { stdio: "inherit" });
  if (lint.status !== 0) process.exit(1);
}
console.log("check:staged passed (check only; no files rewritten or staged)");
