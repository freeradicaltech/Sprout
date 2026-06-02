import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const pin = String(data.get('pin') ?? '');
    const household = await db.household.findFirst();

    if (!household?.parentPin || household.parentPin !== pin) {
      return fail(401, { error: 'Wrong PIN' });
    }
    cookies.set('sprout_parent', '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      // Served over plain HTTP on the LAN/Tailscale — a Secure cookie would be
      // dropped by browsers. Set SPROUT_SECURE_COOKIE=1 when behind HTTPS.
      secure: process.env.SPROUT_SECURE_COOKIE === '1',
      maxAge: 60 * 60 * 8 // 8 hours
    });
    throw redirect(303, '/parent');
  }
};
