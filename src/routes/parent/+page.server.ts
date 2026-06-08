import { db } from '$lib/server/db';
import { localDay } from '$lib/util';
import { adjustStars } from '$lib/server/stars';
import { notify } from '$lib/server/notify';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Parent overview: progress today, recent activity, pending reward requests.
export const load: PageServerLoad = async () => {
  const day = localDay();

  const profiles = await db.profile.findMany({
    orderBy: { createdAt: 'asc' },
    include: { routines: { where: { snoozed: false }, include: { tasks: true } } }
  });

  // Completions today, per profile.
  const allTaskIds = profiles.flatMap((p) => p.routines.flatMap((r) => r.tasks.map((t) => t.id)));
  const doneToday = await db.taskCompletion.findMany({
    where: { taskId: { in: allTaskIds }, day },
    select: { taskId: true }
  });
  const doneSet = new Set(doneToday.map((d) => d.taskId));

  const pending = await db.redemption.findMany({
    where: { status: 'REQUESTED' },
    orderBy: { createdAt: 'desc' },
    include: { reward: true, profile: true }
  });

  // Approved but not yet handed over — the "to give" list.
  const awaiting = await db.redemption.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'asc' },
    include: { reward: true, profile: true }
  });

  return {
    day,
    profiles: profiles.map((p) => {
      const tasks = p.routines.flatMap((r) => r.tasks);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        stars: p.stars,
        total: tasks.length,
        done: tasks.filter((t) => doneSet.has(t.id)).length
      };
    }),
    pending: pending.map((r) => ({
      id: r.id,
      child: r.profile.name,
      reward: r.reward.title,
      cost: r.costAtTime
    })),
    awaiting: awaiting.map((r) => ({
      id: r.id,
      child: r.profile.name,
      reward: r.reward.title,
      icon: r.reward.icon
    }))
  };
};

export const actions: Actions = {
  // Approve a reward request — stars were already deducted at request time.
  approve: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const r = await db.redemption.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { profile: true, reward: true }
    });
    notify('Reward approved', `${r.profile.name} — ${r.reward.title} (ready to give)`, ['white_check_mark']);
    return { ok: true };
  },

  // Mark an approved reward as actually handed over to the child.
  fulfil: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const r = await db.redemption.update({
      where: { id },
      data: { status: 'FULFILLED' },
      include: { profile: true, reward: true }
    });
    notify('Reward given', `${r.profile.name} received ${r.reward.title} 🎉`, ['gift']);
    return { ok: true };
  },

  // Deny a request and refund the stars that were spent on it.
  deny: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const r = await db.redemption.findUnique({ where: { id }, include: { reward: true } });
    if (!r) return fail(404, { error: 'Not found' });
    await db.redemption.update({ where: { id }, data: { status: 'DENIED' } });
    await adjustStars(r.profileId, r.costAtTime, 'BONUS', `Refund: ${r.reward.title}`);
    return { ok: true };
  }
};
