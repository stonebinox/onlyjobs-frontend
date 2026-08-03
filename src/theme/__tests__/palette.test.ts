import { PAPER, INK, PENCIL, STRONG, LOOK, QUIET } from "../palette";
import theme from "../theme";

describe("palette primitives", () => {
  it("PAPER is #F4F5F3", () => {
    expect(PAPER).toBe("#F4F5F3");
  });

  it("INK is #16202A", () => {
    expect(INK).toBe("#16202A");
  });

  it("PENCIL[500] is #1D4E89 (the main interactive shade)", () => {
    expect(PENCIL[500]).toBe("#1D4E89");
  });

  it("STRONG is #1B7A4B", () => {
    expect(STRONG).toBe("#1B7A4B");
  });

  it("LOOK is #8A6D1F", () => {
    expect(LOOK).toBe("#8A6D1F");
  });

  it("QUIET is #6B7280", () => {
    expect(QUIET).toBe("#6B7280");
  });

  it("PENCIL has all 10 shade keys (50..900)", () => {
    const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (const k of keys) {
      expect(PENCIL[k as keyof typeof PENCIL]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("PENCIL shades lighten from 900 to 50", () => {
    // Simply verify 50 is lighter (hex value higher) than 900
    const bright50 = parseInt(PENCIL[50].slice(1), 16);
    const dark900 = parseInt(PENCIL[900].slice(1), 16);
    expect(bright50).toBeGreaterThan(dark900);
  });
});

describe("theme derives primary/brand/blue from PENCIL", () => {
  const colors = (theme as any).colors;

  it("theme.colors.primary[500] === PENCIL[500]", () => {
    expect(colors.primary[500]).toBe(PENCIL[500]);
  });

  it("theme.colors.brand[500] === PENCIL[500]", () => {
    expect(colors.brand[500]).toBe(PENCIL[500]);
  });

  it("theme.colors.blue[500] === PENCIL[500]", () => {
    expect(colors.blue[500]).toBe(PENCIL[500]);
  });

  it("surface.bg === PAPER", () => {
    expect(colors.surface.bg).toBe(PAPER);
  });

  it("text.primary === INK", () => {
    expect(colors.text.primary).toBe(INK);
  });

  it("semantic.error is still #EF4444 (not clobbered by palette change)", () => {
    expect(colors.semantic.error).toBe("#EF4444");
  });
});
