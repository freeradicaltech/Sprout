import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { TASK_ICONS } from '$lib/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const rewards = await db.reward.findMany({ orderBy: { cost: 'asc' } });
  const history = await db.redemption.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: { reward: true, profile: true }
  });
  return { rewards, history, icons: ['gift', ...TASK_ICONS] };
};

async function household() {
  let h = await db.household.findFirst();
  if (!h) h = await db.household.create({ data: {} });
  return h;
}

export const actions: Actions = {
  create: async ({ request }) => {
    const f = await request.formData();
    const title = String(f.get('title') ?? '').trim();
    const cost = Number(f.get('cost') ?? 0);
    if (!title || cost < 0) return fail(400, { error: 'Title and a valid cost are required' });
    const h = await household();
    await db.reward.create({
      data: { householdId: h.id, title, cost, icon: String(f.get('icon') ?? 'gift') }
    });
    return { ok: true };
  },

  toggle: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const r = await db.reward.findUnique({ where: { id } });
    if (r) await db.reward.update({ where: { id }, data: { active: !r.active } });
    return { ok: true };
  },

  delete: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    await db.reward.delete({ where: { id } });
    return { ok: true };
  }
};
