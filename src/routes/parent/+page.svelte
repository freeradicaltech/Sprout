<script lang="ts">
  import Avatar from '$lib/components/Avatar.svelte';
  import TaskIcon from '$lib/components/TaskIcon.svelte';
  import { enhance } from '$app/forms';
  let { data } = $props();
</script>

<svelte:head><title>Parent Dashboard — Sprout</title></svelte:head>

<h1 class="text-3xl font-extrabold text-gray-800 mb-4">Dashboard</h1>

<!-- Pending reward requests -->
{#if data.pending.length}
  <section class="mb-6">
    <h2 class="text-xl font-bold text-gray-700 mb-2">🎁 Reward requests</h2>
    <div class="space-y-2">
      {#each data.pending as r (r.id)}
        <div class="bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-3 flex-wrap">
          <span class="font-bold">{r.child} wants <em>{r.reward}</em> ({r.cost} ⭐)</span>
          <div class="flex gap-2">
            <form method="POST" action="?/approve" use:enhance>
              <input type="hidden" name="id" value={r.id} />
              <button class="tap rounded-xl bg-forest text-white px-4 font-bold">Approve</button>
            </form>
            <form method="POST" action="?/deny" use:enhance>
              <input type="hidden" name="id" value={r.id} />
              <button class="tap rounded-xl bg-gray-200 text-gray-700 px-4 font-bold">Deny</button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}

<!-- Approved, awaiting hand-over -->
{#if data.awaiting.length}
  <section class="mb-6">
    <h2 class="text-xl font-bold text-gray-700 mb-2">📦 To give</h2>
    <div class="space-y-2">
      {#each data.awaiting as r (r.id)}
        <div class="bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-3 flex-wrap">
          <span class="font-bold flex items-center gap-2">
            <TaskIcon icon={r.icon} size={28} />
            {r.child} — <em>{r.reward}</em>
          </span>
          <form method="POST" action="?/fulfil" use:enhance>
            <input type="hidden" name="id" value={r.id} />
            <button class="tap rounded-xl bg-ocean text-white px-4 font-bold">Mark given ✅</button>
          </form>
        </div>
      {/each}
    </div>
  </section>
{/if}

<!-- Today's progress per child -->
<section class="mb-6">
  <h2 class="text-xl font-bold text-gray-700 mb-2">Today ({data.day})</h2>
  <div class="space-y-3">
    {#each data.profiles as p (p.id)}
      <a href={`/parent/profiles/${p.id}`} class="block bg-white rounded-2xl shadow p-4 flex items-center gap-4 hover:bg-gray-50">
        <Avatar key={p.avatar} size={56} />
        <div class="flex-1">
          <div class="flex justify-between">
            <span class="font-bold text-lg">{p.name}</span>
            <span class="text-amber-500 font-bold">⭐ {p.stars}</span>
          </div>
          <div class="h-3 rounded-full bg-gray-100 mt-1 overflow-hidden">
            <div class="h-full bg-forest" style={`width:${p.total ? (p.done / p.total) * 100 : 0}%`}></div>
          </div>
          <span class="text-sm text-gray-500">{p.done} / {p.total} tasks done</span>
        </div>
      </a>
    {/each}
    {#if data.profiles.length === 0}
      <p class="text-gray-500">No kids yet — <a href="/parent/profiles" class="text-sunrise font-bold underline">add one</a>.</p>
    {/if}
  </div>
</section>
