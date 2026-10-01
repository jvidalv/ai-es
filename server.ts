import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve("dist");
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (pathname.includes("\0") || pathname.includes("\\") || pathname.startsWith("//")) {
    response.writeHead(400).end("Bad request");
    return;
  }
  let file = resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const info = await stat(file);
    if (info.isDirectory()) {
      if (!pathname.endsWith("/")) {
        response
          .writeHead(308, {
            Location: `${pathname.split("/").map(encodeURIComponent).join("/")}/${new URL(request.url ?? "/", "http://localhost").search}`,
          })
          .end();
        return;
      }
      file = resolve(file, "index.html");
    }
    const body = await readFile(file);
    if (extname(file) === ".md")
      response.setHeader(
        "Link",
        `<https://ai-es.dev${pathname.replace(/index\.md$/, "")}>; rel="canonical", </llms.txt>; rel="describedby"`,
      );
    response.writeHead(200, {
      "Content-Type": mime[extname(file)] ?? "application/octet-stream",
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
      "Content-Length": body.length,
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    const body = await readFile(resolve(root, "404.html")).catch(() => Buffer.from("Not found"));
    response.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  }
});
server.listen(Number(process.env.PORT ?? 3000), "0.0.0.0", () => console.log("ai-es is listening"));
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
