import { db } from './db';
import { notify } from './notify';
import { localDay, isActiveToday } from '$lib/util';

// A single in-process scheduler that runs while the server is up. It fires
// scheduled task prompts via ntfy (so reminders arrive even when no kiosk tab
// is open) and a weekly per-child summary. Ticks every 30s — fine-grained
// enough to catch every minute, with per-minute de-duplication.

let started = false;
let lastDay = '';
let lastWeeklyKey = '';
const firedPrompts = new Set<string>(); // key: `${taskId}@${day}T${hhmm}`

function hhmm(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function checkPrompts(now: Date) {
  const day = localDay(now);
  const time = hhmm(now);

  // Tasks whose prompt time is this minute. Each due task → its own ntfy push,
  // so several reminders landing in the same minute simply arrive as separate
  // notifications (no clobbering).
  const tasks = await db.task.findMany({
    where: { promptTime: time, type: { in: ['NOTIFICATION', 'TIMED'] } },
    include: { routine: { include: { profile: true } } }
  });

  for (const t of tasks) {
    const r = t.routine;
    if (!r || r.snoozed || !r.profile) continue;
    if (!isActiveToday(r.activeDays, now)) continue;

    const key = `${t.id}@${day}T${time}`;
    if (firedPrompts.has(key)) continue;
    firedPrompts.add(key);

    // Skip if the child already finished it today.
    const done = await db.taskCompletion.findUnique({
      where: { taskId_day: { taskId: t.id, day } }
    });
    if (done) continue;

    await notify('Reminder', `${r.profile.name}: time to ${t.title}`, ['bell']);
  }
}

async function maybeWeekly(now: Date) {
  // Sunday 18:00 local — one per week.
  if (now.getDay() !== 0 || hhmm(now) !== '18:00') return;
  const key = localDay(now);
  if (lastWeeklyKey === key) return;
  lastWeeklyKey = key;

  const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const profiles = await db.profile.findMany({ where: { role: { in: ['CHILD', 'TEEN'] } } });

  const lines: string[] = [];
  for (const p of profiles) {
    const earned = await db.starEntry.aggregate({
      where: { profileId: p.id, createdAt: { gte: since }, amount: { gt: 0 } },
      _sum: { amount: true }
    });
    const tasks = await db.starEntry.count({
      where: { profileId: p.id, createdAt: { gte: since }, reason: 'TASK' }
    });
    lines.push(`${p.name}: +${earned._sum.amount ?? 0} stars from ${tasks} tasks`);
  }
  if (lines.length) await notify('Weekly summary', lines.join('\n'), ['bar_chart']);
}

async function tick() {
  const now = new Date();
  const day = localDay(now);
  if (day !== lastDay) {
    firedPrompts.clear(); // prune yesterday's keys
    lastDay = day;
  }
  await checkPrompts(now);
  await maybeWeekly(now);
}

export function startScheduler() {
  if (started) return;
  started = true;
  lastDay = localDay();
  setInterval(() => {
    tick().catch((e) => console.error('[scheduler] tick failed:', e));
  }, 30_000);
  console.log('[scheduler] started');
}
