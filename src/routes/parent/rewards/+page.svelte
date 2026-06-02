<script lang="ts">
  import TaskIcon from '$lib/components/TaskIcon.svelte';
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let showAdd = $state(false);
</script>

<svelte:head><title>Rewards — Sprout</title></svelte:head>

<div class="flex items-center justify-between mb-4">
  <h1 class="text-3xl font-extrabold text-gray-800">Rewards</h1>
  <button class="tap rounded-xl bg-sunrise text-white px-5 font-bold" onclick={() => (showAdd = !showAdd)}>
    {showAdd ? 'Cancel' : '+ Add'}
  </button>
</div>

{#if showAdd}
  <form method="POST" action="?/create" use:enhance={() => async ({ update }) => { await update(); showAdd = false; }}
    class="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
    <div class="flex gap-2 flex-wrap">
      <input name="title" placeholder="Reward (e.g. 30 min screen time)" required class="flex-1 min-w-[180px] rounded-xl border-2 border-gray-200 p-3" />
      <input name="cost" type="number" min="0" value="5" class="w-24 rounded-xl border-2 border-gray-200 p-3 text-center" title="star cost" />
    </div>
    <div class="flex flex-wrap gap-2">
      {#each data.icons as ic, i (ic)}
        <label class="cursor-pointer">
          <input type="radio" name="icon" value={ic} checked={i === 0} class="peer sr-only" />
          <span class="block rounded-lg p-1 peer-checked:ring-2 ring-sunrise"><TaskIcon icon={ic} size={28} /></span>
        </label>
      {/each}
    </div>
    {#if form?.error}<p class="text-red-500 font-bold">{form.error}</p>{/if}
    <button class="tap rounded-xl bg-forest text-white px-6 font-bold">Create reward</button>
  </form>
{/if}

<div class="space-y-3 mb-8">
  {#each data.rewards as r (r.id)}
    <div class={`bg-white rounded-2xl shadow p-4 flex items-center gap-4 ${r.active ? '' : 'opacity-50'}`}>
      <TaskIcon icon={r.icon} size={40} />
      <div class="flex-1">
        <span class="font-bold text-lg">{r.title}</span>
        <div class="text-amber-500 font-bold">{r.cost} ⭐</div>
      </div>
      <form method="POST" action="?/toggle" use:enhance>
        <input type="hidden" name="id" value={r.id} />
        <button class="tap rounded-xl bg-gray-100 px-4 font-bold text-gray-600">{r.active ? 'Hide' : 'Show'}</button>
      </form>
      <form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm(`Delete reward "${r.title}"?`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={r.id} />
        <button class="tap rounded-xl bg-red-50 text-red-500 px-4 font-bold">✕</button>
      </form>
    </div>
  {/each}
  {#if data.rewards.length === 0}
    <p class="text-gray-500">No rewards yet. Tap <strong>+ Add</strong> to create one kids can redeem with stars.</p>
  {/if}
</div>

<h2 class="text-xl font-bold text-gray-700 mb-2">Redemption history</h2>
<div class="bg-white rounded-2xl shadow divide-y">
  {#each data.history as h (h.id)}
    <div class="p-3 flex justify-between text-sm">
      <span class="font-bold text-gray-700">{h.profile.name} · {h.reward.title}</span>
      <span class="text-gray-400">{h.costAtTime}⭐ · {h.status}</span>
    </div>
  {/each}
  {#if data.history.length === 0}<p class="p-3 text-gray-400 text-sm">No redemptions yet.</p>{/if}
</div>
