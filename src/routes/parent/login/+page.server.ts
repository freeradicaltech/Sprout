import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { setParentCookie } from '$lib/server/session';
import { verifyPin, hashPin, isHashed } from '$lib/server/pin';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const pin = String(data.get('pin') ?? '');
    const household = await db.household.findFirst();

    if (!household?.parentPin || !verifyPin(household.parentPin, pin)) {
      return fail(401, { error: 'Wrong PIN' });
    }
    // Transparently upgrade a legacy plaintext PIN to a hash on first login.
    if (!isHashed(household.parentPin)) {
      await db.household.update({ where: { id: household.id }, data: { parentPin: hashPin(pin) } });
    }
    setParentCookie(cookies, household.sessionMinutes);
    throw redirect(303, '/parent');
  }
};
