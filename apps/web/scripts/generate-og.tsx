import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { site } from "../src/lib/site.ts";

const require = createRequire(import.meta.url);
const font = await readFile(
  require.resolve("@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff"),
);
const stickers = await Promise.all(
  [
    { icon: "08", background: "#a5cbb7", top: 165, left: 745, rotate: -12 },
    { icon: "03", background: "#eed18c", top: 50, left: 930, rotate: 10 },
    { icon: "05", background: "#d9ddd0", top: 330, left: 935, rotate: 9 },
  ].map(async (sticker) => ({
    ...sticker,
    src: `data:image/png;base64,${(await readFile(new URL(`../public/images/ai-es-${sticker.icon}-256.png`, import.meta.url))).toString("base64")}`,
  })),
);
const svg = await satori(
  <div
    style={{
      display: "flex",
      width: "100%",
      height: "100%",
      background: "#1c2723",
      color: "#f7f6ef",
      fontFamily: "DM Sans",
      padding: 64,
      borderLeft: "12px solid #e7bd6b",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", width: 645 }}>
      <div style={{ display: "flex", fontSize: 34, color: "#a5d8bf", marginBottom: 58 }}>
        {site.name}.
      </div>
      <div style={{ fontSize: 66, lineHeight: 1.08, letterSpacing: -2 }}>{site.headline}</div>
      <div style={{ fontSize: 25, color: "#a5d8bf", marginTop: 38 }}>{site.tagline}</div>
    </div>
    {stickers.map((sticker) => (
      <div
        key={sticker.icon}
        style={{
          display: "flex",
          position: "absolute",
          top: sticker.top,
          left: sticker.left,
          width: 195,
          height: 210,
          padding: 20,
          background: sticker.background,
          border: "3px solid #242820",
          borderRadius: 26,
          boxShadow: "7px 9px 0 #101915",
          transform: `rotate(${sticker.rotate}deg)`,
        }}
      >
        <img src={sticker.src} width={150} height={150} alt="" />
      </div>
    ))}
  </div>,
  {
    width: site.socialImageWidth,
    height: site.socialImageHeight,
    fonts: [{ name: "DM Sans", data: font, weight: 700, style: "normal" }],
  },
);
await writeFile(
  new URL(`../public${site.socialImage}`, import.meta.url),
  new Resvg(svg).render().asPng(),
);
