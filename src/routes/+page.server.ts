import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

// Home screen = "who's here?" profile picker for the kiosk.
export const load: PageServerLoad = async () => {
  const profiles = await db.profile.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, avatar: true, theme: true, stars: true, role: true }
  });
  return { profiles };
};
