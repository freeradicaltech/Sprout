import { db } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';
import { adjustStars } from '$lib/server/stars';
import { AVATARS, THEMES, TASK_ICONS } from '$lib/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const profile = await db.profile.findUnique({
    where: { id: params.id },
    include: {
      routines: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } }
      },
      starEntries: { orderBy: { createdAt: 'desc' }, take: 10 }
    }
  });
  if (!profile) throw error(404, 'Profile not found');

  // Other children in the household — copy/template destinations.
  const others = await db.profile.findMany({
    where: { householdId: profile.householdId, id: { not: profile.id } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return { profile, others, avatars: AVATARS, themes: THEMES, icons: TASK_ICONS };
};

const DAYS = [
  { v: '1', l: 'Mon' }, { v: '2', l: 'Tue' }, { v: '3', l: 'Wed' },
  { v: '4', l: 'Thu' }, { v: '5', l: 'Fri' }, { v: '6', l: 'Sat' }, { v: '0', l: 'Sun' }
];
export const _DAYS = DAYS;

export const actions: Actions = {
  updateProfile: async ({ request, params }) => {
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Name required' });
    await db.profile.update({
      where: { id: params.id },
      data: {
        name,
        avatar: String(f.get('avatar') ?? 'fox'),
        theme: String(f.get('theme') ?? 'sunrise'),
        role: String(f.get('role') ?? 'CHILD') as 'CHILD' | 'TEEN' | 'PARENT'
      }
    });
    return { ok: true };
  },

  addRoutine: async ({ request, params }) => {
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Routine name required' });
    const days = DAYS.map((d) => d.v).filter((v) => f.get(`day_${v}`) === 'on');
    const count = await db.routine.count({ where: { profileId: params.id } });
    await db.routine.create({
      data: {
        profileId: params.id!,
        name,
        slot: String(f.get('slot') ?? 'AM') as 'AM' | 'PM' | 'ANYTIME',
        activeDays: (days.length ? days : ['0', '1', '2', '3', '4', '5', '6']).join(','),
        order: count
      }
    });
    return { ok: true };
  },

  deleteRoutine: async ({ request }) => {
    const id = String((await request.formData()).get('routineId') ?? '');
    await db.routine.delete({ where: { id } });
    return { ok: true };
  },

  toggleSnooze: async ({ request }) => {
    const id = String((await request.formData()).get('routineId') ?? '');
    const r = await db.routine.findUnique({ where: { id } });
    if (r) await db.routine.update({ where: { id }, data: { snoozed: !r.snoozed } });
    return { ok: true };
  },

  addTask: async ({ request }) => {
    const f = await request.formData();
    const routineId = String(f.get('routineId') ?? '');
    const title = String(f.get('title') ?? '').trim();
    if (!routineId || !title) return fail(400, { error: 'Task title required' });
    const type = String(f.get('type') ?? 'CHECKLIST') as 'CHECKLIST' | 'TIMED' | 'NOTIFICATION';
    const count = await db.task.count({ where: { routineId } });
    const durationMin = Number(f.get('durationMin') ?? 0);
    await db.task.create({
      data: {
        routineId,
        title,
        icon: String(f.get('icon') ?? 'star'),
        type,
        stars: Math.max(0, Number(f.get('stars') ?? 1)),
        order: count,
        durationSec: type === 'TIMED' && durationMin > 0 ? durationMin * 60 : null,
        promptTime: (type === 'TIMED' || type === 'NOTIFICATION') && f.get('promptTime')
          ? String(f.get('promptTime'))
          : null
      }
    });
    return { ok: true };
  },

  updateTask: async ({ request }) => {
    const f = await request.formData();
    const id = String(f.get('taskId') ?? '');
    const title = String(f.get('title') ?? '').trim();
    if (!id || !title) return fail(400, { error: 'Task title required' });
    const type = String(f.get('type') ?? 'CHECKLIST') as 'CHECKLIST' | 'TIMED' | 'NOTIFICATION';
    const durationMin = Number(f.get('durationMin') ?? 0);
    await db.task.update({
      where: { id },
      data: {
        title,
        icon: String(f.get('icon') ?? 'star'),
        type,
        stars: Math.max(0, Number(f.get('stars') ?? 1)),
        durationSec: type === 'TIMED' && durationMin > 0 ? durationMin * 60 : null,
        promptTime: (type === 'TIMED' || type === 'NOTIFICATION') && f.get('promptTime')
          ? String(f.get('promptTime'))
          : null
      }
    });
    return { ok: true };
  },

  deleteTask: async ({ request }) => {
    const id = String((await request.formData()).get('taskId') ?? '');
    await db.task.delete({ where: { id } });
    return { ok: true };
  },

  // Duplicate a routine (with all its tasks) onto another child, or every
  // other child at once ("ALL"). A lightweight way to share/template routines.
  copyRoutine: async ({ request, params }) => {
    const f = await request.formData();
    const routineId = String(f.get('routineId') ?? '');
    const target = String(f.get('target') ?? '');
    if (!routineId || !target) return fail(400, { error: 'Pick a destination' });

    const source = await db.routine.findUnique({
      where: { id: routineId },
      include: { tasks: { orderBy: { order: 'asc' } } }
    });
    if (!source) return fail(404, { error: 'Routine not found' });

    let targetIds: string[];
    if (target === 'ALL') {
      const others = await db.profile.findMany({
        where: { householdId: (await db.profile.findUnique({ where: { id: params.id! } }))!.householdId, id: { not: params.id! } },
        select: { id: true }
      });
      targetIds = others.map((p) => p.id);
    } else {
      targetIds = [target];
    }

    for (const pid of targetIds) {
      const count = await db.routine.count({ where: { profileId: pid } });
      await db.routine.create({
        data: {
          profileId: pid,
          name: source.name,
          slot: source.slot,
          activeDays: source.activeDays,
          order: count,
          tasks: {
            create: source.tasks.map((t, i) => ({
              title: t.title,
              icon: t.icon,
              type: t.type,
              stars: t.stars,
              order: i,
              durationSec: t.durationSec,
              promptTime: t.promptTime
            }))
          }
        }
      });
    }
    return { ok: true, copied: targetIds.length };
  },

  // Parent-granted bonus or penalty stars (writes to the ledger).
  adjustStars: async ({ request, params }) => {
    const f = await request.formData();
    const amount = Number(f.get('amount') ?? 0);
    if (!amount) return fail(400, { error: 'Amount required' });
    await adjustStars(
      params.id!,
      amount,
      amount > 0 ? 'BONUS' : 'PENALTY',
      String(f.get('note') ?? '') || undefined
    );
    return { ok: true };
  }
};
