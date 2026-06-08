import { db } from '$lib/server/db';
import { localDay, isActiveToday } from '$lib/util';
import type { PageServerLoad } from './$types';

const DAYS = 14;

export const load: PageServerLoad = async () => {
  const today = new Date();

  // Build the window of dates (oldest → newest) we report on.
  const dates: { day: string; date: Date }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push({ day: localDay(d), date: d });
  }
  const windowStart = dates[0].day;

  const profiles = await db.profile.findMany({
    where: { role: { in: ['CHILD', 'TEEN'] } },
    orderBy: { createdAt: 'asc' },
    include: { routines: { where: { snoozed: false }, include: { tasks: true } } }
  });

  const allTaskIds = profiles.flatMap((p) => p.routines.flatMap((r) => r.tasks.map((t) => t.id)));
  const completions = allTaskIds.length
    ? await db.taskCompletion.findMany({
        where: { taskId: { in: allTaskIds }, day: { gte: windowStart } },
        select: { taskId: true, day: true }
      })
    : [];
  // day -> Set(taskId)
  const doneByDay = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!doneByDay.has(c.day)) doneByDay.set(c.day, new Set());
    doneByDay.get(c.day)!.add(c.taskId);
  }

  const result = profiles.map((p) => {
    const days = dates.map(({ day, date }) => {
      // Tasks that would be active for this profile on that weekday.
      const activeIds = p.routines
        .filter((r) => isActiveToday(r.activeDays, date))
        .flatMap((r) => r.tasks.map((t) => t.id));
      const doneSet = doneByDay.get(day) ?? new Set();
      const done = activeIds.filter((id) => doneSet.has(id)).length;
      const total = activeIds.length;
      const perfect = total > 0 && done === total;
      return { day, dow: date.getDay(), done, total, perfect };
    });

    // Current streak: consecutive perfect days ending today, or ending
    // yesterday if today isn't finished yet (so it doesn't read 0 all morning).
    let streak = 0;
    const last = days.length - 1;
    let i = last;
    if (!days[last].perfect) i = last - 1; // allow today-in-progress
    for (; i >= 0; i--) {
      if (days[i].perfect) streak++;
      else break;
    }

    return { id: p.id, name: p.name, avatar: p.avatar, stars: p.stars, days, streak };
  });

  return { profiles: result, days: DAYS };
};
