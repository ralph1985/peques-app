import { createRequire } from "node:module";

// Reuse Next's existing image compiler; no extra runtime dependency.
const requireNext = createRequire(import.meta.resolve("next"));
const sharp = requireNext("sharp");
for (const size of [180, 192, 512]) {
  await sharp("public/icon.svg").resize(size, size).png().toFile(`public/icon-${size}.png`);
}
