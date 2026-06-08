import type { Handle } from '@sveltejs/kit';
import { startScheduler } from '$lib/server/scheduler';

// Kick off the background prompt / weekly-summary scheduler once at server boot.
startScheduler();

// Minimal session: a signed-ish cookie marks the parent area as unlocked.
// (For a single-household LAN/Tailscale deployment this is sufficient; harden
// with a real session store if you ever expose it more widely.)
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.parentUnlocked = event.cookies.get('sprout_parent') === '1';
  return resolve(event);
};
