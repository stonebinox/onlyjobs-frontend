import { getVerdictColor, getVerdictRing, VERDICT_COLORS, MATCH_HEX } from "../verdict-colors";

// ── getVerdictColor ───────────────────────────────────────────────────────────

describe("getVerdictColor", () => {
  it("Strong match → green / #1B7A4B", () => {
    const result = getVerdictColor("Strong match");
    expect(result.colorScheme).toBe("green");
    expect(result.hex).toBe("#1B7A4B");
  });

  it("Mild match → yellow / #8A6D1F", () => {
    const result = getVerdictColor("Mild match");
    expect(result.colorScheme).toBe("yellow");
    expect(result.hex).toBe("#8A6D1F");
  });

  it("Weak match → gray / #6B7280", () => {
    const result = getVerdictColor("Weak match");
    expect(result.colorScheme).toBe("gray");
    expect(result.hex).toBe("#6B7280");
  });

  it("No match → gray / #6B7280", () => {
    const result = getVerdictColor("No match");
    expect(result.colorScheme).toBe("gray");
    expect(result.hex).toBe("#6B7280");
  });

  it("unknown verdict → gray / #6B7280", () => {
    const result = getVerdictColor("something else");
    expect(result.colorScheme).toBe("gray");
    expect(result.hex).toBe("#6B7280");
  });

  it("empty string → gray / #6B7280", () => {
    const result = getVerdictColor("");
    expect(result.colorScheme).toBe("gray");
    expect(result.hex).toBe("#6B7280");
  });

  it("No match is NEVER red and NEVER #EF4444", () => {
    const result = getVerdictColor("No match");
    expect(result.colorScheme).not.toBe("red");
    expect(result.hex).not.toBe("#EF4444");
  });

  it("unknown verdict is NEVER red and NEVER #EF4444", () => {
    const result = getVerdictColor("anything");
    expect(result.colorScheme).not.toBe("red");
    expect(result.hex).not.toBe("#EF4444");
  });
});

// ── VERDICT_COLORS — ring gradient stops ─────────────────────────────────────

describe("VERDICT_COLORS — ring gradient stops (shared source)", () => {
  it("Strong match gradient: #1B7A4B → #145C37", () => {
    expect(VERDICT_COLORS["Strong match"].gradient[0]).toBe("#1B7A4B");
    expect(VERDICT_COLORS["Strong match"].gradient[1]).toBe("#145C37");
  });

  it("Mild match gradient: #8A6D1F → #6B4E15", () => {
    expect(VERDICT_COLORS["Mild match"].gradient[0]).toBe("#8A6D1F");
    expect(VERDICT_COLORS["Mild match"].gradient[1]).toBe("#6B4E15");
  });

  it("Weak match gradient: #6B7280 → #4B5563 (grey, not red)", () => {
    expect(VERDICT_COLORS["Weak match"].gradient[0]).toBe("#6B7280");
    expect(VERDICT_COLORS["Weak match"].gradient[1]).toBe("#4B5563");
  });

  it("No match gradient: #6B7280 → #4B5563 (grey, not red)", () => {
    expect(VERDICT_COLORS["No match"].gradient[0]).toBe("#6B7280");
    expect(VERDICT_COLORS["No match"].gradient[1]).toBe("#4B5563");
  });

  it("each verdict gradient has exactly two stops", () => {
    for (const entry of Object.values(VERDICT_COLORS)) {
      expect(entry.gradient).toHaveLength(2);
    }
  });
});

// ── VERDICT_COLORS — badge tints ─────────────────────────────────────────────

describe("VERDICT_COLORS — badge tints (shared source)", () => {
  it("Strong match: badgeBg #D1FAE5, badgeText #145C37", () => {
    expect(VERDICT_COLORS["Strong match"].badgeBg).toBe("#D1FAE5");
    expect(VERDICT_COLORS["Strong match"].badgeText).toBe("#145C37");
  });

  it("Mild match: badgeBg #FEF3C7, badgeText #6B4E15", () => {
    expect(VERDICT_COLORS["Mild match"].badgeBg).toBe("#FEF3C7");
    expect(VERDICT_COLORS["Mild match"].badgeText).toBe("#6B4E15");
  });

  it("Weak match: badgeBg #F3F4F6, badgeText #4B5563 (grey, not red)", () => {
    expect(VERDICT_COLORS["Weak match"].badgeBg).toBe("#F3F4F6");
    expect(VERDICT_COLORS["Weak match"].badgeText).toBe("#4B5563");
  });

  it("No match: badgeBg #F3F4F6, badgeText #4B5563 (grey, not red)", () => {
    expect(VERDICT_COLORS["No match"].badgeBg).toBe("#F3F4F6");
    expect(VERDICT_COLORS["No match"].badgeText).toBe("#4B5563");
  });
});

// ── VERDICT_COLORS — no red anywhere ─────────────────────────────────────────

describe("VERDICT_COLORS — no verdict resolves to red anywhere", () => {
  const RED_HEXES = ["#EF4444", "#ef4444", "#DC2626", "#dc2626", "#B91C1C", "#b91c1c"];

  it("no hex field in any VERDICT_COLORS entry is red", () => {
    for (const entry of Object.values(VERDICT_COLORS)) {
      for (const red of RED_HEXES) {
        expect(entry.hex.toLowerCase()).not.toBe(red.toLowerCase());
      }
    }
  });

  it("no gradient stop in any VERDICT_COLORS entry is red", () => {
    for (const entry of Object.values(VERDICT_COLORS)) {
      for (const stop of entry.gradient) {
        for (const red of RED_HEXES) {
          expect(stop.toLowerCase()).not.toBe(red.toLowerCase());
        }
      }
    }
  });

  it("no badgeBg or badgeText in any VERDICT_COLORS entry is red", () => {
    for (const entry of Object.values(VERDICT_COLORS)) {
      for (const red of RED_HEXES) {
        expect(entry.badgeBg.toLowerCase()).not.toBe(red.toLowerCase());
        expect(entry.badgeText.toLowerCase()).not.toBe(red.toLowerCase());
      }
    }
  });

  it("no colorScheme in any VERDICT_COLORS entry is 'red'", () => {
    for (const entry of Object.values(VERDICT_COLORS)) {
      expect(entry.colorScheme).not.toBe("red");
    }
  });
});

// ── getVerdictRing ────────────────────────────────────────────────────────────

describe("getVerdictRing", () => {
  it("Strong match returns correct ring values from shared source", () => {
    const ring = getVerdictRing("Strong match");
    expect(ring.hex).toBe(VERDICT_COLORS["Strong match"].hex);
    expect(ring.badgeBg).toBe(VERDICT_COLORS["Strong match"].badgeBg);
    expect(ring.badgeText).toBe(VERDICT_COLORS["Strong match"].badgeText);
    expect(ring.gradient).toEqual(VERDICT_COLORS["Strong match"].gradient);
  });

  it("No match returns grey ring values", () => {
    const ring = getVerdictRing("No match");
    expect(ring.hex).toBe("#6B7280");
    expect(ring.badgeBg).toBe("#F3F4F6");
    expect(ring.badgeText).toBe("#4B5563");
    expect(ring.gradient).toEqual(["#6B7280", "#4B5563"]);
  });

  it("No match ring hex is not red", () => {
    expect(getVerdictRing("No match").hex).not.toBe("#EF4444");
  });

  it("unknown verdict falls back to grey ring values", () => {
    const ring = getVerdictRing("unknown");
    expect(ring.hex).toBe("#6B7280");
    expect(ring.gradient[0]).toBe("#6B7280");
    expect(ring.gradient[1]).toBe("#4B5563");
  });

  it("returns gradient as a two-element array", () => {
    for (const verdict of ["Strong match", "Mild match", "Weak match", "No match", "unknown"]) {
      expect(getVerdictRing(verdict).gradient).toHaveLength(2);
    }
  });
});

// ── MATCH_HEX ────────────────────────────────────────────────────────────────

describe("MATCH_HEX — derives from VERDICT_COLORS, no independent duplication", () => {
  it("MATCH_HEX.strong === VERDICT_COLORS['Strong match'].hex", () => {
    expect(MATCH_HEX.strong).toBe(VERDICT_COLORS["Strong match"].hex);
  });

  it("MATCH_HEX.mild === VERDICT_COLORS['Mild match'].hex", () => {
    expect(MATCH_HEX.mild).toBe(VERDICT_COLORS["Mild match"].hex);
  });

  it("MATCH_HEX.weak === VERDICT_COLORS['Weak match'].hex", () => {
    expect(MATCH_HEX.weak).toBe(VERDICT_COLORS["Weak match"].hex);
  });

  it("MATCH_HEX.none === VERDICT_COLORS['No match'].hex", () => {
    expect(MATCH_HEX.none).toBe(VERDICT_COLORS["No match"].hex);
  });

  it("MATCH_HEX.none is grey, not red", () => {
    expect(MATCH_HEX.none).toBe("#6B7280");
    expect(MATCH_HEX.none).not.toBe("#EF4444");
  });
});
