import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve(__dirname, "..");
const AUTHORITY_FILE = path.resolve(SRC_DIR, "utils/analytics.ts");
const TESTS_DIR = path.resolve(SRC_DIR, "__tests__");

const POSTHOG_IMPORT_PATTERN = /(?:from\s+["']posthog-js["']|require\(["']posthog-js["']\))/;

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === TESTS_DIR) continue;
      collectSourceFiles(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("PostHog single-authority invariant", () => {
  const sourceFiles = collectSourceFiles(SRC_DIR);

  it("src/utils/analytics.ts imports posthog-js (test is meaningful)", () => {
    const content = fs.readFileSync(AUTHORITY_FILE, "utf-8");
    expect(POSTHOG_IMPORT_PATTERN.test(content)).toBe(true);
  });

  it("no file other than src/utils/analytics.ts imports posthog-js", () => {
    const offenders = sourceFiles.filter(
      (f) => f !== AUTHORITY_FILE && POSTHOG_IMPORT_PATTERN.test(fs.readFileSync(f, "utf-8"))
    );
    const relativeOffenders = offenders.map((f) => path.relative(SRC_DIR, f));
    expect(offenders).toHaveLength(0);
    if (offenders.length > 0) {
      throw new Error(
        `posthog-js imported outside of src/utils/analytics.ts:\n  ${relativeOffenders.join("\n  ")}`
      );
    }
  });
});
