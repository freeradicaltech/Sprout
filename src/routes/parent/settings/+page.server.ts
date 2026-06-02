import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { setParentCookie, clearParentCookie } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const h = await db.household.findFirst();
  return {
    name: h?.name ?? 'Our Family',
    pinSet: !!h?.parentPin,
    sessionMinutes: h?.sessionMinutes ?? 480
  };
};

async function household() {
  let h = await db.household.findFirst();
  if (!h) h = await db.household.create({ data: {} });
  return h;
}

export const actions: Actions = {
  rename: async ({ request }) => {
    const name = String((await request.formData()).get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Name required' });
    const h = await household();
    await db.household.update({ where: { id: h.id }, data: { name } });
    return { ok: true, renamed: true };
  },

  setPin: async ({ request, cookies }) => {
    const f = await request.formData();
    const pin = String(f.get('pin') ?? '').trim();
    const confirm = String(f.get('confirm') ?? '').trim();
    if (pin && pin !== confirm) return fail(400, { error: 'PINs do not match' });
    if (pin && !/^\d{4,8}$/.test(pin)) return fail(400, { error: 'PIN must be 4–8 digits' });
    const h = await household();
    await db.household.update({ where: { id: h.id }, data: { parentPin: pin || null } });
    // Keep current session unlocked after changing the PIN.
    setParentCookie(cookies, h.sessionMinutes);
    return { ok: true, pinUpdated: true, cleared: !pin };
  },

  setSession: async ({ request, cookies }) => {
    const minutes = Number((await request.formData()).get('sessionMinutes') ?? 480);
    if (!Number.isFinite(minutes) || minutes < 0) return fail(400, { error: 'Invalid timeout' });
    const h = await household();
    await db.household.update({ where: { id: h.id }, data: { sessionMinutes: minutes } });
    // Re-issue the current session cookie under the new policy.
    setParentCookie(cookies, minutes);
    return { ok: true, sessionUpdated: true };
  },

  lock: async ({ cookies }) => {
    clearParentCookie(cookies);
    return { ok: true, locked: true };
  }
};
