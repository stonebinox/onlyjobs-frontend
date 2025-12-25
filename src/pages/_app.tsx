import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

import theme from "../theme/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuideProvider } from "@/contexts/GuideContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>OnlyJobs</title>
      </Head>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <GuideProvider>
            <Component {...pageProps} />
          </GuideProvider>
        </AuthProvider>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
