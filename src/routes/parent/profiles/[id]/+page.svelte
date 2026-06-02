<script lang="ts">
  import Avatar from '$lib/components/Avatar.svelte';
  import TaskIcon from '$lib/components/TaskIcon.svelte';
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  const DAYS = [
    { v: '1', l: 'Mon' }, { v: '2', l: 'Tue' }, { v: '3', l: 'Wed' },
    { v: '4', l: 'Thu' }, { v: '5', l: 'Fri' }, { v: '6', l: 'Sat' }, { v: '0', l: 'Sun' }
  ];
  const dayLabel = (csv: string) =>
    DAYS.filter((d) => csv.split(',').includes(d.v)).map((d) => d.l).join(' ');

  let addRoutine = $state(false);
  let addTaskFor = $state<string | null>(null);
  let newTaskType = $state('CHECKLIST');
</script>

<svelte:head><title>{data.profile.name} — Edit</title></svelte:head>

<div class="flex items-center gap-3 mb-4">
  <a href="/parent/profiles" class="tap rounded-xl bg-white shadow px-4 flex items-center text-xl">←</a>
  <Avatar key={data.profile.avatar} size={48} />
  <h1 class="text-3xl font-extrabold text-gray-800">{data.profile.name}</h1>
  <span class="ml-auto text-amber-500 font-extrabold text-xl">⭐ {data.profile.stars}</span>
</div>

<!-- Profile details -->
<details class="bg-white rounded-2xl shadow p-4 mb-4">
  <summary class="font-bold text-gray-700 cursor-pointer">Edit profile details</summary>
  <form method="POST" action="?/updateProfile" use:enhance class="mt-4 space-y-3">
    <input name="name" value={data.profile.name} class="w-full rounded-xl border-2 border-gray-200 p-3" />
    <div class="flex flex-wrap gap-2">
      {#each data.avatars as a (a)}
        <label class="cursor-pointer">
          <input type="radio" name="avatar" value={a} checked={a === data.profile.avatar} class="peer sr-only" />
          <span class="block rounded-xl p-1 peer-checked:ring-4 ring-sunrise"><Avatar key={a} size={40} /></span>
        </label>
      {/each}
    </div>
    <div class="flex gap-3 flex-wrap">
      <select name="theme" class="flex-1 rounded-xl border-2 border-gray-200 p-3 capitalize">
        {#each data.themes as t (t)}<option value={t} selected={t === data.profile.theme}>{t}</option>{/each}
      </select>
      <select name="role" class="flex-1 rounded-xl border-2 border-gray-200 p-3">
        {#each ['CHILD', 'TEEN', 'PARENT'] as r (r)}<option value={r} selected={r === data.profile.role}>{r}</option>{/each}
      </select>
    </div>
    <button class="tap rounded-xl bg-forest text-white px-6 font-bold">Save</button>
  </form>
</details>

<!-- Bonus / penalty stars -->
<form method="POST" action="?/adjustStars" use:enhance class="bg-white rounded-2xl shadow p-4 mb-6 flex gap-2 flex-wrap items-center">
  <span class="font-bold text-gray-700">Adjust stars:</span>
  <input name="amount" type="number" value="1" class="w-20 rounded-xl border-2 border-gray-200 p-2 text-center" />
  <input name="note" placeholder="reason (optional)" class="flex-1 min-w-[120px] rounded-xl border-2 border-gray-200 p-2" />
  <button class="tap rounded-xl bg-amber-400 text-white px-4 font-bold">Apply</button>
  <span class="text-xs text-gray-400">use a negative number to deduct</span>
</form>

<!-- Routines -->
<div class="flex items-center justify-between mb-3">
  <h2 class="text-2xl font-extrabold text-gray-700">Routines</h2>
  <button class="tap rounded-xl bg-sunrise text-white px-5 font-bold" onclick={() => (addRoutine = !addRoutine)}>
    {addRoutine ? 'Cancel' : '+ Routine'}
  </button>
</div>

{#if addRoutine}
  <form method="POST" action="?/addRoutine" use:enhance={() => async ({ update }) => { await update(); addRoutine = false; }}
    class="bg-white rounded-2xl shadow p-4 mb-4 space-y-3">
    <div class="flex gap-3 flex-wrap">
      <input name="name" placeholder="Routine name (e.g. Morning)" required class="flex-1 min-w-[160px] rounded-xl border-2 border-gray-200 p-3" />
      <select name="slot" class="rounded-xl border-2 border-gray-200 p-3">
        <option value="AM">🌅 Morning</option>
        <option value="PM">🌙 Evening</option>
        <option value="ANYTIME">⭐ Anytime</option>
      </select>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each DAYS as d (d.v)}
        <label class="cursor-pointer">
          <input type="checkbox" name={`day_${d.v}`} checked class="peer sr-only" />
          <span class="block rounded-lg px-3 py-2 bg-gray-100 font-bold text-gray-500 peer-checked:bg-sunrise peer-checked:text-white">{d.l}</span>
        </label>
      {/each}
    </div>
    <button class="tap rounded-xl bg-forest text-white px-6 font-bold">Add routine</button>
  </form>
{/if}

{#each data.profile.routines as routine (routine.id)}
  <section class="bg-white rounded-2xl shadow p-4 mb-4">
    <div class="flex items-center gap-2 flex-wrap mb-2">
      <h3 class="text-xl font-bold text-gray-800">
        {routine.slot === 'AM' ? '🌅' : routine.slot === 'PM' ? '🌙' : '⭐'} {routine.name}
      </h3>
      <span class="text-sm text-gray-400">{dayLabel(routine.activeDays)}</span>
      {#if routine.snoozed}<span class="text-xs bg-amber-100 text-amber-600 rounded-full px-2 py-0.5 font-bold">snoozed</span>{/if}
      <div class="ml-auto flex gap-2">
        <form method="POST" action="?/toggleSnooze" use:enhance>
          <input type="hidden" name="routineId" value={routine.id} />
          <button class="tap rounded-lg bg-gray-100 px-3 text-sm font-bold text-gray-600">{routine.snoozed ? 'Resume' : 'Snooze'}</button>
        </form>
        <form method="POST" action="?/deleteRoutine" use:enhance onsubmit={(e) => { if (!confirm('Delete this routine and its tasks?')) e.preventDefault(); }}>
          <input type="hidden" name="routineId" value={routine.id} />
          <button class="tap rounded-lg bg-red-50 text-red-500 px-3 font-bold">✕</button>
        </form>
      </div>
    </div>

    <div class="space-y-2">
      {#each routine.tasks as task (task.id)}
        <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
          <TaskIcon icon={task.icon} size={28} />
          <span class="font-bold text-gray-700">{task.title}</span>
          <span class="text-xs text-gray-400">
            {task.type === 'TIMED' ? `⏱ ${(task.durationSec ?? 0) / 60}m` : task.type === 'NOTIFICATION' ? `🔔 ${task.promptTime ?? ''}` : ''}
          </span>
          <span class="ml-auto text-amber-500 font-bold">+{task.stars}⭐</span>
          <form method="POST" action="?/deleteTask" use:enhance>
            <input type="hidden" name="taskId" value={task.id} />
            <button class="tap rounded-lg bg-red-50 text-red-400 px-3 font-bold">✕</button>
          </form>
        </div>
      {/each}
      {#if routine.tasks.length === 0}<p class="text-sm text-gray-400">No tasks yet.</p>{/if}
    </div>

    {#if addTaskFor === routine.id}
      <form method="POST" action="?/addTask" use:enhance={() => async ({ update }) => { await update(); addTaskFor = null; }}
        class="mt-3 border-t pt-3 space-y-3">
        <input type="hidden" name="routineId" value={routine.id} />
        <div class="flex gap-2 flex-wrap">
          <input name="title" placeholder="Task title" required class="flex-1 min-w-[140px] rounded-xl border-2 border-gray-200 p-2" />
          <input name="stars" type="number" value="1" min="0" class="w-16 rounded-xl border-2 border-gray-200 p-2 text-center" title="stars" />
        </div>
        <div class="flex flex-wrap gap-2">
          {#each data.icons as ic, i (ic)}
            <label class="cursor-pointer">
              <input type="radio" name="icon" value={ic} checked={i === 0} class="peer sr-only" />
              <span class="block rounded-lg p-1 peer-checked:ring-2 ring-sunrise"><TaskIcon icon={ic} size={26} /></span>
            </label>
          {/each}
        </div>
        <div class="flex gap-2 flex-wrap items-center">
          <select name="type" bind:value={newTaskType} class="rounded-xl border-2 border-gray-200 p-2">
            <option value="CHECKLIST">✅ Checklist</option>
            <option value="TIMED">⏱ Timed</option>
            <option value="NOTIFICATION">🔔 Reminder</option>
          </select>
          {#if newTaskType === 'TIMED'}
            <input name="durationMin" type="number" value="10" min="1" class="w-20 rounded-xl border-2 border-gray-200 p-2" title="minutes" />
            <span class="text-sm text-gray-400">min</span>
          {/if}
          {#if newTaskType === 'TIMED' || newTaskType === 'NOTIFICATION'}
            <input name="promptTime" type="time" class="rounded-xl border-2 border-gray-200 p-2" title="prompt time" />
          {/if}
        </div>
        <button class="tap rounded-xl bg-forest text-white px-6 font-bold">Add task</button>
      </form>
    {:else}
      <button class="mt-3 tap rounded-xl bg-gray-100 px-4 font-bold text-gray-600" onclick={() => { addTaskFor = routine.id; newTaskType = 'CHECKLIST'; }}>
        + Task
      </button>
    {/if}
  </section>
{/each}

{#if form?.error}<p class="text-red-500 font-bold">{form.error}</p>{/if}

<!-- Recent star activity -->
<details class="bg-white rounded-2xl shadow p-4 mb-6">
  <summary class="font-bold text-gray-700 cursor-pointer">Recent star activity</summary>
  <ul class="mt-3 space-y-1 text-sm">
    {#each data.profile.starEntries as e (e.id)}
      <li class="flex justify-between">
        <span class="text-gray-600">{e.reason}{e.note ? ` · ${e.note}` : ''}</span>
        <span class={e.amount >= 0 ? 'text-forest font-bold' : 'text-red-500 font-bold'}>{e.amount > 0 ? '+' : ''}{e.amount}⭐</span>
      </li>
    {/each}
    {#if data.profile.starEntries.length === 0}<li class="text-gray-400">No activity yet.</li>{/if}
  </ul>
</details>
