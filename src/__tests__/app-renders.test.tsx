import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next/router', () => ({
  useRouter: () => ({
    events: { on: jest.fn(), off: jest.fn() },
  }),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@chakra-ui/react', () => ({
  __esModule: true,
  ChakraProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/theme/theme', () => ({ __esModule: true, default: {} }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
}));

jest.mock('@/components/CookieConsent', () => ({
  CookieConsent: () => null,
}));

// Import after all jest.mock() calls so hoisting is in effect.
// eslint-disable-next-line import/first
import MyApp from '@/pages/_app';

const StubPage = () => <div>stub</div>;

describe('_app.tsx — fontsource', () => {
  it('mounts without throwing — fontsource replaces the old google font loader', () => {
    expect(() => {
      render(
        <MyApp
          Component={StubPage}
          pageProps={{}}
          router={{} as Parameters<typeof MyApp>[0]['router']}
        />
      );
    }).not.toThrow();
  });

  it('global style declares all three font family CSS variables with correct family names', () => {
    render(
      <MyApp
        Component={StubPage}
        pageProps={{}}
        router={{} as Parameters<typeof MyApp>[0]['router']}
      />
    );

    // Collect text from all <style> elements the render injected (head + body).
    const styleText = Array.from(document.querySelectorAll('style'))
      .map(el => el.textContent ?? '')
      .join('\n');

    // Each variable must resolve to the correct family name so a rename or deletion fails here.
    expect(styleText).toMatch(/--font-plus-jakarta\s*:\s*['"]?Plus Jakarta Sans/);
    expect(styleText).toMatch(/--font-inter\s*:\s*['"]?Inter/);
    expect(styleText).toMatch(/--font-jetbrains\s*:\s*['"]?JetBrains Mono/);
  });
});
