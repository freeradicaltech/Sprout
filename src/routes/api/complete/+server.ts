import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { adjustStars } from '$lib/server/stars';
import { notify } from '$lib/server/notify';
import { localDay } from '$lib/util';
import type { RequestHandler } from './$types';

// Mark a task complete for today and award its stars (idempotent per day).
export const POST: RequestHandler = async ({ request }) => {
  const { taskId, profileId } = await request.json();
  if (!taskId || !profileId) throw error(400, 'taskId and profileId required');

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw error(404, 'Task not found');

  const day = localDay();

  // Already done today? Return current balance without double-awarding.
  const existing = await db.taskCompletion.findUnique({
    where: { taskId_day: { taskId, day } }
  });
  if (existing) {
    const p = await db.profile.findUnique({ where: { id: profileId } });
    return json({ ok: true, alreadyDone: true, stars: p?.stars ?? 0 });
  }

  await db.taskCompletion.create({ data: { taskId, day } });
  const profile = await adjustStars(profileId, task.stars, 'TASK', task.title);

  notify('⭐ Star earned', `${profile.name} completed "${task.title}" (+${task.stars})`, ['star']);

  return json({ ok: true, stars: profile.stars });
};
