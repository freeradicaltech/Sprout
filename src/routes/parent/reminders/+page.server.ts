import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { localDay } from '$lib/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const today = localDay();
  const reminders = await db.reminder.findMany({
    where: { date: { gte: today } },
    orderBy: { date: 'asc' },
    include: { profile: true }
  });
  const profiles = await db.profile.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true } });
  return { reminders, profiles };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const f = await request.formData();
    const title = String(f.get('title') ?? '').trim();
    const date = String(f.get('date') ?? '');
    if (!title || !date) return fail(400, { error: 'Title and date are required' });
    const profileId = String(f.get('profileId') ?? '');
    await db.reminder.create({
      data: { title, date, icon: String(f.get('icon') ?? 'calendar'), profileId: profileId || null }
    });
    return { ok: true };
  },

  delete: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    await db.reminder.delete({ where: { id } });
    return { ok: true };
  }
};
