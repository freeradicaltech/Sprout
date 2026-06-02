<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<svelte:head><title>Reminders — Sprout</title></svelte:head>

<h1 class="text-3xl font-extrabold text-gray-800 mb-4">Reminders</h1>

<form method="POST" action="?/create" use:enhance class="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
  <div class="flex gap-2 flex-wrap">
    <input name="title" placeholder="e.g. Library day, Grandma's birthday" required class="flex-1 min-w-[180px] rounded-xl border-2 border-gray-200 p-3" />
    <input name="date" type="date" required class="rounded-xl border-2 border-gray-200 p-3" />
  </div>
  <select name="profileId" class="w-full rounded-xl border-2 border-gray-200 p-3">
    <option value="">Everyone</option>
    {#each data.profiles as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
  </select>
  {#if form?.error}<p class="text-red-500 font-bold">{form.error}</p>{/if}
  <button class="tap rounded-xl bg-forest text-white px-6 font-bold">Add reminder</button>
</form>

<div class="space-y-3">
  {#each data.reminders as r (r.id)}
    <div class="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
      <span class="text-2xl">📅</span>
      <div class="flex-1">
        <span class="font-bold text-lg">{r.title}</span>
        <div class="text-sm text-gray-500">{r.date}{r.profile ? ` · ${r.profile.name}` : ' · Everyone'}</div>
      </div>
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={r.id} />
        <button class="tap rounded-xl bg-red-50 text-red-500 px-4 font-bold">✕</button>
      </form>
    </div>
  {/each}
  {#if data.reminders.length === 0}<p class="text-gray-500">No upcoming reminders.</p>{/if}
</div>
