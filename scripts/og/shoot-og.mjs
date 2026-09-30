import { chromium } from "playwright";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "sample-match-report.html");
const outPath = path.resolve(__dirname, "../../public/og/sample-match-report.png");

// Ensure output directory exists
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// Install chromium if missing
try {
  execSync("node_modules/.bin/playwright install chromium --with-deps", {
    cwd: path.resolve(__dirname, "../.."),
    stdio: "inherit",
  });
} catch {
  // Already installed — ignore
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

await page.goto(`file://${htmlPath}`);

// Brief wait to allow CSS/layout to settle
await page.waitForTimeout(300);

await page.screenshot({
  path: outPath,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();

console.log(`OG image written to: ${outPath}`);
