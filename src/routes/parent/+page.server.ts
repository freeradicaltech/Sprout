import { db } from '$lib/server/db';
import { localDay } from '$lib/util';
import type { PageServerLoad } from './$types';

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
    }))
  };
};
