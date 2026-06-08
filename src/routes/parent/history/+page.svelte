<script lang="ts">
  import Avatar from '$lib/components/Avatar.svelte';
  let { data } = $props();

  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function cellClass(d: { total: number; done: number; perfect: boolean }) {
    if (d.total === 0) return 'bg-gray-100 text-gray-300'; // nothing scheduled
    if (d.perfect) return 'bg-forest text-white';
    if (d.done > 0) return 'bg-forest-soft text-forest';
    return 'bg-red-50 text-red-300';
  }
</script>

<svelte:head><title>History & Streaks — Sprout</title></svelte:head>

<h1 class="text-3xl font-extrabold text-gray-800 mb-4">History & Streaks</h1>
<p class="text-gray-500 mb-6">Last {data.days} days. A green square is a perfect day (all tasks done).</p>

<div class="space-y-4">
  {#each data.profiles as p (p.id)}
    <section class="bg-white rounded-2xl shadow p-4">
      <div class="flex items-center gap-3 mb-3">
        <Avatar key={p.avatar} size={48} />
        <h2 class="text-xl font-extrabold text-gray-800">{p.name}</h2>
        <span class="ml-auto flex items-center gap-3">
          <span class="text-amber-500 font-bold">⭐ {p.stars}</span>
          <span class="rounded-full bg-sunrise-soft text-sunrise font-extrabold px-3 py-1">🔥 {p.streak} day{p.streak === 1 ? '' : 's'}</span>
        </span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        {#each p.days as d (d.day)}
          <div
            class={`h-11 w-11 rounded-lg flex flex-col items-center justify-center text-[11px] font-bold ${cellClass(d)}`}
            title={`${d.day}: ${d.done}/${d.total} done`}
          >
            <span class="opacity-70">{DOW[d.dow]}</span>
            <span>{d.total ? `${d.done}/${d.total}` : '–'}</span>
          </div>
        {/each}
      </div>
    </section>
  {/each}
  {#if data.profiles.length === 0}
    <p class="text-gray-500">No kids yet — <a href="/parent/profiles" class="text-sunrise font-bold underline">add one</a>.</p>
  {/if}
</div>
