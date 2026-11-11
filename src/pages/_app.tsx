import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

// Self-hosted fonts via @fontsource — no build-time network fetch
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";

import theme from "../theme/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuideProvider } from "@/contexts/GuideContext";
import { initAnalytics, trackPageView } from "@/utils/analytics";
import { captureFirstTouch } from "@/utils/attribution";
import { captureMetaClick } from "@/utils/metaClick";
import { trackPixelPageView } from "@/lib/metaPixel";
import { CookieConsent } from "@/components/CookieConsent";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // StrictMode re-runs effects; refs survive, so the initial pixel PageView fires once per load.
  const initialPixelFired = useRef(false);

  useEffect(() => {
    try { captureFirstTouch(); } catch { /* fail-open */ }
    captureMetaClick();
    initAnalytics();
    trackPageView(window.location.pathname + window.location.search);
    if (!initialPixelFired.current) {
      initialPixelFired.current = true;
      trackPixelPageView(window.location.pathname + window.location.search);
    }

    const handleRouteChange = (url: string) => {
      trackPageView(url);
      trackPixelPageView(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#16202A" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style jsx global>{`
        :root {
          --font-plus-jakarta: 'Plus Jakarta Sans', sans-serif;
          --font-inter: 'Inter', sans-serif;
          --font-jetbrains: 'JetBrains Mono', monospace;
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
            <CookieConsent />
          </GuideProvider>
        </AuthProvider>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
