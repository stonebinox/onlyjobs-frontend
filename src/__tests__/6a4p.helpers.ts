/* Shared helpers for 6a4p adversarial tests (not a test file: no .test suffix). */

export type FbqCall = any[];

export interface FbqRecorder {
  calls: FbqCall[];
  /** snapshot taken at the moment fbq('init', ...) was invoked */
  initSnapshots: { args: any[]; disablePushState: unknown; autoConfigSeenBefore: boolean }[];
  restore: () => void;
  /** the function the code under test assigned to window.fbq (undefined if never assigned) */
  readonly current: any;
}

/**
 * Installs an accessor on window.fbq BEFORE the code under test runs. Whatever function the
 * code assigns is wrapped in a Proxy that records every invocation (and still forwards it),
 * so we observe calls regardless of how the pixel stub is built.
 */
export function installFbqRecorder(): FbqRecorder {
  const calls: FbqCall[] = [];
  const initSnapshots: FbqRecorder['initSnapshots'] = [];
  let stored: any;
  Object.defineProperty(window, 'fbq', {
    configurable: true,
    enumerable: true,
    get() {
      return stored;
    },
    set(v: any) {
      if (typeof v !== 'function') {
        stored = v;
        return;
      }
      stored = new Proxy(v, {
        apply(target, thisArg, args) {
          const a = Array.from(args as ArrayLike<any>);
          if (a[0] === 'init') {
            initSnapshots.push({
              args: a,
              disablePushState: (target as any).disablePushState,
              autoConfigSeenBefore: calls.some(
                (c) => c[0] === 'set' && c[1] === 'autoConfig' && c[2] === false,
              ),
            });
          }
          calls.push(a);
          return Reflect.apply(target, thisArg, args);
        },
      });
    },
  });
  return {
    calls,
    initSnapshots,
    get current() {
      return stored;
    },
    restore() {
      delete (window as any).fbq;
    },
  };
}

export function fbeventsScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script')).filter((s) =>
    /connect\.facebook\.net/.test(s.getAttribute('src') || ''),
  ) as HTMLScriptElement[];
}

export function anyPixelScript(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script')).filter((s) =>
    /facebook\.net|fbevents/.test((s.getAttribute('src') || '') + (s.textContent || '')),
  ) as HTMLScriptElement[];
}

/** Resets DOM state that the pixel might have left behind. Leaves one inert <script> so
 *  snippets that do insertBefore(firstScript) behave as in a real browser. */
export function resetPixelDom() {
  document.querySelectorAll('script').forEach((s) => s.remove());
  const seed = document.createElement('script');
  seed.setAttribute('data-seed', '1');
  document.head.appendChild(seed);
  delete (window as any).fbq;
  delete (window as any)._fbq;
  try { sessionStorage.clear(); } catch { /* ignore */ }
  try { localStorage.clear(); } catch { /* ignore */ }
}

export function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

export function setUrl(pathAndQuery: string) {
  window.history.replaceState({}, '', pathAndQuery);
}
