import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { AVATARS, THEMES } from '$lib/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const profiles = await db.profile.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { routines: true } } }
  });
  return {
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      theme: p.theme,
      role: p.role,
      stars: p.stars,
      routines: p._count.routines
    })),
    avatars: AVATARS,
    themes: THEMES
  };
};

async function household() {
  let h = await db.household.findFirst();
  if (!h) h = await db.household.create({ data: {} });
  return h;
}

export const actions: Actions = {
  create: async ({ request }) => {
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Name is required' });
    const h = await household();
    await db.profile.create({
      data: {
        householdId: h.id,
        name,
        avatar: String(f.get('avatar') ?? 'fox'),
        theme: String(f.get('theme') ?? 'sunrise'),
        role: (String(f.get('role') ?? 'CHILD') as 'CHILD' | 'TEEN' | 'PARENT')
      }
    });
    return { ok: true };
  },

  delete: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    await db.profile.delete({ where: { id } });
    return { ok: true };
  }
};
