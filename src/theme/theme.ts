import { extendTheme } from "@chakra-ui/react";

const colors = {
  brand: {
    50: "#E6F6FF",
    100: "#B3E0FF",
    200: "#80CBFF",
    300: "#4DB6FF",
    400: "#1AA1FF",
    500: "#0078D4", // primary color
    600: "#0062AB",
    700: "#004B83",
    800: "#00345A",
    900: "#001E32",
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
        bg: "gray.50",
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
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
      },
    },
  },
});

export default theme;
