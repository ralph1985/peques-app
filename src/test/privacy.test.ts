import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve("src");
const sourceFiles = readdirSync(sourceRoot, { recursive: true })
  .map(String)
  .filter(
    (file) => /\.(ts|tsx)$/.test(file) && !file.endsWith(".test.ts") && !file.startsWith("test/"),
  );

describe("local-only architecture guardrails", () => {
  it("contains no family network transport, server actions or remote persistence", () => {
    const forbidden =
      /\b(?:fetch\s*\(|axios\b|XMLHttpRequest\b|WebSocket\b|EventSource\b|sendBeacon\s*\()|["']use server["']/;
    const violations = sourceFiles.filter((file) =>
      forbidden.test(readFileSync(path.join(sourceRoot, file), "utf8")),
    );
    expect(violations).toEqual([]);
    expect(sourceFiles.filter((file) => /(?:^|\/)route\.(?:ts|tsx)$/.test(file))).toEqual([]);
  });

  it("keeps React UI independent from Dexie and private browser storage", () => {
    const uiFiles = sourceFiles.filter((file) => file.includes("/ui/") || file.endsWith(".tsx"));
    const directStorage =
      /from\s+["']dexie["']|\bindexedDB\s*\.|\blocalStorage\s*\.|\bsessionStorage\s*\./;
    expect(
      uiFiles.filter((file) =>
        directStorage.test(readFileSync(path.join(sourceRoot, file), "utf8")),
      ),
    ).toEqual([]);
  });

  it("builds static files without remote SDKs or telemetry configuration", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(Object.keys(pkg.dependencies).sort()).toEqual([
      "@dnd-kit/helpers",
      "@dnd-kit/react",
      "@serwist/next",
      "dexie",
      "motion",
      "next",
      "react",
      "react-dom",
    ]);
    expect(pkg.scripts.build).toContain("NEXT_TELEMETRY_DISABLED=1");
    expect(readFileSync("next.config.ts", "utf8")).toContain('output: "export"');
    const worker = readFileSync("src/app/sw.ts", "utf8");
    expect(worker).not.toContain("runtimeCaching:");
    expect(worker).not.toMatch(/\b(?:getDatabase|indexedDB)\s*\(/);
  });
});
