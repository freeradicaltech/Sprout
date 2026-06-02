import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { localDay, isActiveToday } from '$lib/util';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const profile = await db.profile.findUnique({
    where: { id: params.id },
    include: {
      routines: {
        where: { snoozed: false },
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } }
      }
    }
  });
  if (!profile) throw error(404, 'Profile not found');

  const day = localDay();

  // Only routines active today.
  const routines = profile.routines.filter((r) => isActiveToday(r.activeDays));

  // Which tasks are already done today?
  const taskIds = routines.flatMap((r) => r.tasks.map((t) => t.id));
  const done = await db.taskCompletion.findMany({
    where: { taskId: { in: taskIds }, day },
    select: { taskId: true }
  });
  const doneSet = new Set(done.map((d) => d.taskId));

  // Reminders for today.
  const reminders = await db.reminder.findMany({
    where: { date: day, OR: [{ profileId: profile.id }, { profileId: null }] }
  });

  // Active rewards the child can spend stars on.
  const rewards = await db.reward.findMany({
    where: { householdId: profile.householdId, active: true },
    orderBy: { cost: 'asc' }
  });

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      theme: profile.theme,
      sound: profile.sound,
      stars: profile.stars
    },
    routines: routines.map((r) => ({
      id: r.id,
      name: r.name,
      slot: r.slot,
      tasks: r.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        icon: t.icon,
        type: t.type,
        stars: t.stars,
        durationSec: t.durationSec,
        promptTime: t.promptTime,
        done: doneSet.has(t.id)
      }))
    })),
    reminders,
    rewards: rewards.map((r) => ({ id: r.id, title: r.title, icon: r.icon, cost: r.cost })),
    day
  };
};
