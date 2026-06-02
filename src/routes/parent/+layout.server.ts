import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Gate the whole /parent area behind the household PIN (if one is set).
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const household = await db.household.findFirst();
  const pinSet = !!household?.parentPin;

  if (pinSet && !locals.parentUnlocked && !url.pathname.endsWith('/login')) {
    throw redirect(303, '/parent/login');
  }
  return { pinSet, unlocked: locals.parentUnlocked };
};
