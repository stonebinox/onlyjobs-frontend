import { extendTheme } from "@chakra-ui/react";

const colors = {
  brand: {
    50: "#F5F5F5",
    100: "#EBEBEB",
    200: "#D6D6D6",
    300: "#C2C2C2",
    400: "#ADADAD",
    500: "#999999", // primary gray
    600: "#747474",
    700: "#5C5C5C",
    800: "#333333",
    900: "#1A1A1A",
  },
  // Semantic colors for important elements
  semantic: {
    link: "#2B6CB0",
    linkHover: "#1A4F8B",
    success: "#2F855A",
    warning: "#C05621",
    error: "#C53030",
    info: "#2B6CB0",
    primary: "#ffa500",
  },
};

const fonts = {
  heading: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
};

const theme = extendTheme({
  colors,
  fonts,
  styles: {
    global: {
      body: {
        bg: "#F7F7F7",
        color: "brand.900",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "md",
      },
      variants: {
        solid: {
          bg: "brand.800",
          color: "white",
          _hover: {
            bg: "brand.900",
          },
        },
        outline: {
          borderColor: "brand.800",
          color: "brand.800",
          _hover: {
            bg: "brand.100",
          },
        },
        ghost: {
          color: "brand.800",
          _hover: {
            bg: "brand.100",
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
        colorScheme: "brand",
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
    Alert: {
      variants: {
        success: {
          container: {
            bg: "#E6F6EF",
            borderColor: "semantic.success",
          },
          icon: { color: "semantic.success" },
        },
        error: {
          container: {
            bg: "#FEEAE8",
            borderColor: "semantic.error",
          },
          icon: { color: "semantic.error" },
        },
        warning: {
          container: {
            bg: "#FEEBC8",
            borderColor: "semantic.warning",
          },
          icon: { color: "semantic.warning" },
        },
        info: {
          container: {
            bg: "#EBF8FF",
            borderColor: "semantic.info",
          },
          icon: { color: "semantic.info" },
        },
      },
    },
  },
});

export default theme;
