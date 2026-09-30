/**
 * Asset check — onlyjobs-24g.2.1: OG image for /sample-match-report
 *
 * Verifies that public/og/sample-match-report.png exists and is
 * exactly 1200×630 pixels (read from the PNG IHDR chunk).
 *
 * Failure = the asset is missing or has wrong dimensions.
 * Do NOT skip — throw so CI catches a missing regeneration step.
 */

import fs from "fs";
import path from "path";

const OG_PATH = path.resolve(__dirname, "../../public/og/sample-match-report.png");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);

  // Verify PNG signature
  if (!PNG_SIG.equals(buf.subarray(0, 8))) {
    throw new Error("File does not have a valid PNG signature");
  }

  // IHDR starts at byte 8: 4-byte length, 4-byte "IHDR", 4-byte width, 4-byte height
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

describe("OG asset: /sample-match-report", () => {
  test("public/og/sample-match-report.png exists", () => {
    if (!fs.existsSync(OG_PATH)) {
      throw new Error(
        `OG image missing at ${OG_PATH}. Run: npm run og:sample`
      );
    }
  });

  test("PNG dimensions are exactly 1200×630", () => {
    if (!fs.existsSync(OG_PATH)) {
      throw new Error(
        `OG image missing — cannot check dimensions. Run: npm run og:sample`
      );
    }
    const { width, height } = readPngDimensions(OG_PATH);
    expect(width).toBe(1200);
    expect(height).toBe(630);
  });
});
