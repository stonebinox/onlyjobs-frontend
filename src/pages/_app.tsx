import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";

import theme from "../theme/theme";
import { AuthProvider } from "@/contexts/AuthContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ChakraProvider>
  );
}

export default MyApp;
