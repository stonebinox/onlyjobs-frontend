import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false, // Can enable later for dark mode
};

const colors = {
  // Primary - Electric Purple (AI/Intelligence signifier)
  primary: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6", // Main brand color
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },

  // Secondary - Vibrant Coral (Energy/Action)
  secondary: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316", // CTAs, energy
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },

  // Accent - Electric Blue (Links/Interactive)
  accent: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Match Score Colors (Semantic)
  match: {
    strong: "#22C55E",
    mild: "#3B82F6",
    weak: "#F59E0B",
    none: "#EF4444",
  },

  // Freshness Indicators
  freshness: {
    fresh: "#10B981",
    warm: "#F59E0B",
    stale: "#9CA3AF",
  },

  // Surface Colors (Dark mode ready - semantic names)
  surface: {
    bg: "#FAFAFA",
    card: "#FFFFFF",
    elevated: "#FFFFFF",
    border: "#E5E7EB",
    borderSubtle: "#F3F4F6",
  },

  // Text Colors (Dark mode ready - semantic names)
  text: {
    primary: "#111827",
    secondary: "#4B5563",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  // Legacy brand colors (keeping for backwards compatibility during transition)
  brand: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6",
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },

  // Semantic colors for components
  semantic: {
    link: "#3B82F6",
    linkHover: "#2563EB",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    primary: "#8B5CF6",
  },
};

const fonts = {
  heading: "var(--font-plus-jakarta), 'Plus Jakarta Sans', Inter, system-ui, sans-serif",
  body: "var(--font-inter), Inter, system-ui, sans-serif",
  mono: "var(--font-jetbrains), 'JetBrains Mono', 'Fira Code', monospace",
};

const shadows = {
  card: "0 4px 20px rgba(0, 0, 0, 0.08)",
  cardHover: "0 8px 30px rgba(139, 92, 246, 0.12)",
  button: "0 4px 15px rgba(139, 92, 246, 0.25)",
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
          bgGradient: "linear(135deg, primary.500, secondary.500)",
          color: "white",
          _hover: {
            bgGradient: "linear(135deg, primary.600, secondary.600)",
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
          bgGradient: "linear(135deg, primary.500, pink.500)",
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
            bg: "#DBEAFE",
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
              boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
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
            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
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
