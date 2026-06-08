import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { adjustStars } from '$lib/server/stars';
import { publish } from '$lib/server/bus';
import { localDay } from '$lib/util';
import type { RequestHandler } from './$types';

// Undo today's completion of a task (for mistaken taps) and claw back the
// stars it awarded. Idempotent: no-op if the task wasn't completed today.
export const POST: RequestHandler = async ({ request }) => {
  const { taskId, profileId, client } = await request.json();
  if (!taskId || !profileId) throw error(400, 'taskId and profileId required');

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw error(404, 'Task not found');

  const day = localDay();
  const existing = await db.taskCompletion.findUnique({
    where: { taskId_day: { taskId, day } }
  });
  if (!existing) {
    const p = await db.profile.findUnique({ where: { id: profileId } });
    return json({ ok: true, alreadyUndone: true, stars: p?.stars ?? 0 });
  }

  await db.taskCompletion.delete({ where: { taskId_day: { taskId, day } } });
  // Reverse the award in the ledger so balances stay consistent.
  const profile = await adjustStars(profileId, -task.stars, 'TASK', `Undo: ${task.title}`);
  publish({ profileId, kind: 'task', source: client });

  return json({ ok: true, stars: profile.stars });
};
