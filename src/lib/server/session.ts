import type { Cookies } from '@sveltejs/kit';

export const PARENT_COOKIE = 'sprout_parent';

// Set (or refresh) the parent-unlocked cookie. `sessionMinutes === 0` means
// "lock every time" — a session cookie with no maxAge that the browser drops
// when it closes, so the PIN is asked for again on the next visit.
export function setParentCookie(cookies: Cookies, sessionMinutes: number) {
  cookies.set(PARENT_COOKIE, '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    // Served over plain HTTP on the LAN/Tailscale — a Secure cookie would be
    // dropped by browsers. Set SPROUT_SECURE_COOKIE=1 when behind HTTPS.
    secure: process.env.SPROUT_SECURE_COOKIE === '1',
    ...(sessionMinutes > 0 ? { maxAge: sessionMinutes * 60 } : {})
  });
}

export function clearParentCookie(cookies: Cookies) {
  cookies.delete(PARENT_COOKIE, { path: '/' });
}
