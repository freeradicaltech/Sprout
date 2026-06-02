<script lang="ts">
  import Avatar from '$lib/components/Avatar.svelte';
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let showAdd = $state(false);
</script>

<svelte:head><title>Kids — Sprout</title></svelte:head>

<div class="flex items-center justify-between mb-4">
  <h1 class="text-3xl font-extrabold text-gray-800">Kids</h1>
  <button class="tap rounded-xl bg-sunrise text-white px-5 font-bold" onclick={() => (showAdd = !showAdd)}>
    {showAdd ? 'Cancel' : '+ Add'}
  </button>
</div>

{#if showAdd}
  <form
    method="POST"
    action="?/create"
    use:enhance={() => async ({ update }) => { await update(); showAdd = false; }}
    class="bg-white rounded-2xl shadow p-5 mb-6 space-y-4"
  >
    <input name="name" placeholder="Name" required class="w-full rounded-xl border-2 border-gray-200 p-3 text-lg" />
    <div>
      <p class="font-bold text-gray-600 mb-1">Avatar</p>
      <div class="flex flex-wrap gap-2">
        {#each data.avatars as a, i (a)}
          <label class="cursor-pointer">
            <input type="radio" name="avatar" value={a} checked={i === 0} class="peer sr-only" />
            <span class="block rounded-xl p-1 peer-checked:ring-4 ring-sunrise"><Avatar key={a} size={48} /></span>
          </label>
        {/each}
      </div>
    </div>
    <div class="flex gap-4 flex-wrap">
      <label class="flex-1 min-w-[140px]">
        <span class="font-bold text-gray-600">Theme</span>
        <select name="theme" class="w-full rounded-xl border-2 border-gray-200 p-3 capitalize">
          {#each data.themes as t (t)}<option value={t}>{t}</option>{/each}
        </select>
      </label>
      <label class="flex-1 min-w-[140px]">
        <span class="font-bold text-gray-600">Role</span>
        <select name="role" class="w-full rounded-xl border-2 border-gray-200 p-3">
          <option value="CHILD">Child</option>
          <option value="TEEN">Teen</option>
          <option value="PARENT">Parent</option>
        </select>
      </label>
    </div>
    {#if form?.error}<p class="text-red-500 font-bold">{form.error}</p>{/if}
    <button class="tap w-full rounded-xl bg-forest text-white text-lg font-bold">Create</button>
  </form>
{/if}

<div class="space-y-3">
  {#each data.profiles as p (p.id)}
    <div class="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
      <Avatar key={p.avatar} size={56} />
      <a href={`/parent/profiles/${p.id}`} class="flex-1">
        <span class="font-bold text-lg">{p.name}</span>
        <span class="ml-2 text-xs uppercase tracking-wide text-gray-400">{p.role}</span>
        <div class="text-sm text-gray-500">⭐ {p.stars} · {p.routines} routine{p.routines === 1 ? '' : 's'}</div>
      </a>
      <a href={`/parent/profiles/${p.id}`} class="tap rounded-xl bg-gray-100 px-4 flex items-center font-bold text-gray-600">Edit</a>
      <form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm(`Delete ${p.name}? This removes their routines and history.`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={p.id} />
        <button class="tap rounded-xl bg-red-50 text-red-500 px-4 font-bold">✕</button>
      </form>
    </div>
  {/each}
  {#if data.profiles.length === 0}
    <p class="text-gray-500">No kids yet. Tap <strong>+ Add</strong> to create the first profile.</p>
  {/if}
</div>
