import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { MATCH_HEX } from "@/utils/verdict-colors";
import { PAPER, INK, PENCIL } from "@/theme/palette";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  // Pencil — THE only accent (links, primary buttons, interactive)
  primary: PENCIL,
  brand: PENCIL,
  blue: PENCIL,

  // Secondary — retired coral; keep key so stale references don't break
  secondary: PENCIL,

  // Accent — retired electric-blue; keep key so stale references don't break
  accent: PENCIL,

  // Match Score Colors (Semantic) — derived from the single source of truth in verdict-colors.ts
  match: {
    strong: MATCH_HEX.strong,
    mild:   MATCH_HEX.mild,
    weak:   MATCH_HEX.weak,
    none:   MATCH_HEX.none,
  },

  // Freshness Indicators
  freshness: {
    fresh: "#10B981",
    warm: "#F59E0B",
    stale: "#9CA3AF",
  },

  // Surface Colors
  surface: {
    bg: PAPER,
    card: "#FFFFFF",
    elevated: "#FFFFFF",
    border: "#E5E7EB",
    borderSubtle: "#F3F4F6",
  },

  // Text Colors
  text: {
    primary: INK,
    secondary: "#4B5563",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  // Semantic colors for components
  semantic: {
    link: PENCIL[500],
    linkHover: PENCIL[700],
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: PENCIL[500],
    primary: PENCIL[500],
  },
};

const fonts = {
  heading: "var(--font-plus-jakarta), 'Plus Jakarta Sans', Inter, system-ui, sans-serif",
  body: "var(--font-inter), Inter, system-ui, sans-serif",
  mono: "var(--font-jetbrains), 'JetBrains Mono', 'Fira Code', monospace",
};

const shadows = {
  card: "0 4px 20px rgba(0, 0, 0, 0.08)",
  cardHover: "0 8px 30px rgba(29, 78, 137, 0.12)",
  button: "0 4px 15px rgba(29, 78, 137, 0.25)",
  elevated: "0 20px 50px rgba(0, 0, 0, 0.1)",
};

const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  shadows,
  radii,
  styles: {
    global: {
      body: {
        bg: "surface.bg",
        color: "text.primary",
      },
      "*::selection": {
        bg: "primary.100",
        color: "primary.900",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "xl",
        transition: "all 0.2s ease",
      },
      variants: {
        solid: (props: { colorScheme?: string }) => ({
          bg: props.colorScheme === "blue" ? "primary.500" : undefined,
          color: "white",
          _hover: {
            bg: props.colorScheme === "blue" ? "primary.600" : undefined,
            transform: "translateY(-1px)",
            boxShadow: "button",
          },
          _active: {
            transform: "scale(0.98)",
          },
        }),
        outline: {
          borderColor: "primary.500",
          color: "primary.600",
          borderWidth: "2px",
          _hover: {
            bg: "primary.50",
            transform: "translateY(-1px)",
          },
        },
        ghost: {
          color: "text.secondary",
          _hover: {
            bg: "surface.borderSubtle",
            color: "text.primary",
          },
        },
        gradient: {
          bg: "primary.500",
          color: "white",
          _hover: {
            bg: "primary.600",
            transform: "translateY(-1px)",
            boxShadow: "button",
          },
        },
        link: {
          color: "semantic.link",
          _hover: {
            color: "semantic.linkHover",
            textDecoration: "underline",
          },
        },
      },
      defaultProps: {
        colorScheme: "blue",
      },
    },
    Link: {
      baseStyle: {
        color: "semantic.link",
        _hover: {
          color: "semantic.linkHover",
          textDecoration: "underline",
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "2xl",
          border: "1px solid",
          borderColor: "surface.border",
          bg: "surface.card",
          boxShadow: "card",
          transition: "all 0.2s ease",
          _hover: {
            boxShadow: "cardHover",
            borderColor: "primary.200",
          },
        },
      },
    },
    Badge: {
      variants: {
        ai: {
          bg: "primary.500",
          color: "white",
          fontWeight: "bold",
          px: 2,
          py: 1,
          borderRadius: "md",
        },
        fresh: {
          bg: "freshness.fresh",
          color: "white",
        },
        warm: {
          bg: "freshness.warm",
          color: "white",
        },
        stale: {
          bg: "freshness.stale",
          color: "white",
        },
        matchStrong: {
          bg: "match.strong",
          color: "white",
        },
        matchMild: {
          bg: "match.mild",
          color: "white",
        },
        matchWeak: {
          bg: "match.weak",
          color: "white",
        },
        matchNone: {
          bg: "match.none",
          color: "white",
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tablist: {
            borderBottom: "2px solid",
            borderColor: "surface.border",
          },
          tab: {
            fontWeight: "semibold",
            color: "text.tertiary",
            borderBottom: "2px solid transparent",
            mb: "-2px",
            _selected: {
              color: "primary.600",
              borderBottomColor: "primary.500",
            },
            _hover: {
              color: "primary.500",
              bg: "primary.50",
            },
          },
        },
      },
    },
    Alert: {
      variants: {
        success: {
          container: {
            bg: "#DCFCE7",
            borderColor: "semantic.success",
            borderRadius: "xl",
          },
          icon: { color: "semantic.success" },
        },
        error: {
          container: {
            bg: "#FEE2E2",
            borderColor: "semantic.error",
            borderRadius: "xl",
          },
          icon: { color: "semantic.error" },
        },
        warning: {
          container: {
            bg: "#FEF3C7",
            borderColor: "semantic.warning",
            borderRadius: "xl",
          },
          icon: { color: "semantic.warning" },
        },
        info: {
          container: {
            bg: PENCIL[50],
            borderColor: "semantic.info",
            borderRadius: "xl",
          },
          icon: { color: "semantic.info" },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: "xl",
            borderColor: "surface.border",
            _focus: {
              borderColor: "primary.500",
              boxShadow: "0 0 0 3px rgba(29, 78, 137, 0.1)",
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          borderRadius: "xl",
          borderColor: "surface.border",
          _focus: {
            borderColor: "primary.500",
            boxShadow: "0 0 0 3px rgba(29, 78, 137, 0.1)",
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: "2xl",
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          borderRadius: "2xl 0 0 2xl",
        },
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: "heading",
        fontWeight: "bold",
        color: "text.primary",
      },
    },
  },
});

export default theme;
