#!/usr/bin/env node
import { createWriteStream, mkdirSync, statSync } from "node:fs";
import { get } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = dirname(__dirname);
const fontDir = join(root, "public", "fonts");
mkdirSync(fontDir, { recursive: true });

const fonts = [
  {
    name: "NotoSans-Regular.ttf",
    urls: [
      "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"
    ]
  },
  {
    name: "NotoSans-Bold.ttf",
    urls: [
      "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
      "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf"
    ]
  }
];

function hasLikelyFontHeader(filePath) {
  try {
    const size = statSync(filePath).size;
    return size > 100000;
  } catch {
    return false;
  }
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
        response.resume();
        download(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed ${url}: ${response.statusCode}`));
        return;
      }
      const file = createWriteStream(destination);
      response.pipe(file);
      file.on("finish", () => file.close(() => {
        if (!hasLikelyFontHeader(destination)) {
          reject(new Error(`Downloaded file is too small to be a valid font: ${destination}`));
          return;
        }
        resolve(undefined);
      }));
      file.on("error", reject);
    });
    request.on("error", reject);
    request.setTimeout(30000, () => request.destroy(new Error("Font download timeout")));
  });
}

for (const font of fonts) {
  const destination = join(fontDir, font.name);
  if (hasLikelyFontHeader(destination)) {
    console.log(`Font already available: ${font.name}`);
    continue;
  }
  let downloaded = false;
  for (const url of font.urls) {
    try {
      await download(url, destination);
      console.log(`Downloaded ${font.name}`);
      downloaded = true;
      break;
    } catch (error) {
      console.warn(`[fonts] ${font.name} from ${url} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!downloaded) {
    console.warn(`[fonts] ${font.name} was not downloaded; PDF exporter will try @fontsource/system/runtime fallback.`);
  }
}
