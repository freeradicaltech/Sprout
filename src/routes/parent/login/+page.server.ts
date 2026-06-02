import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { setParentCookie } from '$lib/server/session';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const pin = String(data.get('pin') ?? '');
    const household = await db.household.findFirst();

    if (!household?.parentPin || household.parentPin !== pin) {
      return fail(401, { error: 'Wrong PIN' });
    }
    setParentCookie(cookies, household.sessionMinutes);
    throw redirect(303, '/parent');
  }
};
