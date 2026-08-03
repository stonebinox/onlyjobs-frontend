export function isSafeReturnTo(returnTo: string | null | undefined, origin: string): boolean {
  if (!returnTo || !returnTo.startsWith('/')) return false;
  try {
    const u = new URL(returnTo, origin);
    return u.origin === origin;
  } catch {
    return false;
  }
}
