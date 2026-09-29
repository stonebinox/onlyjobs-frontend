import React from 'react';
import { render } from '@testing-library/react';

// ── Mocks (hoisted before imports) ────────────────────────────────────────────

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  return {
    __esModule: true,
    // Forward the `as` prop so semantic-element assertions are meaningful.
    Heading: ({ as: AsTag = 'h2', children, ...rest }: any) =>
      React.createElement(AsTag, rest, children),
    Box: ({ as: AsTag = 'div', children, ...rest }: any) =>
      React.createElement(AsTag, rest, children),
    Text: ({ as: AsTag = 'p', children, ...rest }: any) =>
      React.createElement(AsTag, rest, children),
    Container: ({ children, ...rest }: any) => React.createElement('div', rest, children),
    HStack: ({ children, ...rest }: any) => React.createElement('div', rest, children),
    VStack: ({ children, ...rest }: any) => React.createElement('div', rest, children),
    Badge: ({ children, ...rest }: any) => React.createElement('span', rest, children),
    useColorModeValue: (light: any) => light,
  };
});

jest.mock('styled-components', () => {
  const React = require('react');
  const styled = (_Tag: any) => (_strings: any, ..._interps: any[]) => {
    function StyledMock({ children, ...rest }: any) {
      return React.createElement('a', rest, children);
    }
    return StyledMock;
  };
  return { __esModule: true, default: styled };
});

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: any) =>
      React.createElement('a', { href, ...rest }, children),
  };
});

jest.mock('@/theme/theme', () => ({
  __esModule: true,
  default: { colors: { semantic: { primary: '#000' } } },
}));

jest.mock('@/theme/palette', () => ({
  PAPER: '#ffffff',
  PENCIL: { 300: '#aaaaaa', 500: '#555555' },
}));

jest.mock('next/document', () => {
  const React = require('react');
  return {
    __esModule: true,
    Html: ({ children, lang }: any) => React.createElement('html', { lang }, children),
    Head: () => React.createElement('head', null),
    Main: () => React.createElement('main', null),
    NextScript: () => React.createElement('div', { 'data-testid': 'next-script' }),
  };
});

// eslint-disable-next-line import/first
import { JsonLd } from '@/components/JsonLd';
// eslint-disable-next-line import/first
import { Logo } from '@/components/Logo';
// eslint-disable-next-line import/first
import { Footer } from '@/components/Footer';
// eslint-disable-next-line import/first
import Document from '@/pages/_document';

// ── JsonLd ────────────────────────────────────────────────────────────────────

describe('JsonLd', () => {
  it('renders a script tag with type application/ld+json', () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite" }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('serializes the data as valid JSON', () => {
    const data = { "@context": "https://schema.org", "@type": "Organization", "name": "Test" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.innerHTML ?? 'null');
    expect(parsed["@type"]).toBe("Organization");
    expect(parsed["name"]).toBe("Test");
  });

  it('escapes < to \\u003c to prevent </script> injection', () => {
    const { container } = render(<JsonLd data={{ "name": "A<script>B" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).not.toContain('<script>');
    expect(script?.innerHTML).toContain('\\u003cscript>');
  });
});

// ── Logo ──────────────────────────────────────────────────────────────────────

describe('Logo', () => {
  it('does not render as an h1 or h2 element', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h2')).toBeNull();
  });

  it('renders the wordmark text', () => {
    const { container } = render(<Logo />);
    expect(container.textContent).toContain('Only');
    expect(container.textContent).toContain('Jobs');
  });
});

// ── Footer ────────────────────────────────────────────────────────────────────

describe('Footer wordmark semantic element', () => {
  it('renders "OnlyJobs" wordmark as a span, not as any heading element', () => {
    // The Chakra mock above defaults Heading to <h2> unless `as` overrides it.
    // This test therefore FAILS if the Footer wordmark loses its as="span".
    const { container } = render(<Footer />);
    const headingEls = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const wordmarkHeadings = Array.from(headingEls).filter(
      el => el.textContent?.trim() === 'OnlyJobs'
    );
    expect(wordmarkHeadings).toHaveLength(0);
  });
});

// ── _document ─────────────────────────────────────────────────────────────────

describe('_document.tsx', () => {
  it('is a function component that renders without throwing', () => {
    expect(() => render(<Document />)).not.toThrow();
  });

  it('sets lang="en-US" on the html element', () => {
    const { container } = render(<Document />);
    expect(container.innerHTML).toContain('lang="en-US"');
  });
});
