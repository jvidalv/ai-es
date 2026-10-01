import { spawn } from "node:child_process";
const gates = [
  "check",
  "test",
  "check:rules",
  "check:comment-length",
  "check:comment-density",
  "check:vite-config",
];
const results = await Promise.all(
  gates.map(
    (name) =>
      new Promise<boolean>((resolve) => {
        const child = spawn("npm", ["run", name], { stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        child.stdout.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.stderr.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.on("error", (error) => {
          console.error(`${name}: ${error.message}`);
          resolve(false);
        });
        child.on("close", (code) => {
          console.log(`${code === 0 ? "PASS" : "FAIL"} ${name}`);
          if (code !== 0) console.error(output);
          resolve(code === 0);
        });
      }),
  ),
);
if (results.some((ok) => !ok)) process.exitCode = 1;
