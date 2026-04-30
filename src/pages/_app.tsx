import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect } from "react";

import theme from "../theme/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuideProvider } from "@/contexts/GuideContext";
import { initAnalytics, trackPageView } from "@/utils/analytics";

// Load fonts with next/font for optimal performance
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    initAnalytics();
    trackPageView(window.location.pathname + window.location.search);

    const handleRouteChange = (url: string) => trackPageView(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8B5CF6" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style jsx global>{`
        :root {
          --font-plus-jakarta: ${plusJakartaSans.style.fontFamily};
          --font-inter: ${inter.style.fontFamily};
          --font-jetbrains: ${jetbrainsMono.style.fontFamily};
        }
      `}</style>
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
