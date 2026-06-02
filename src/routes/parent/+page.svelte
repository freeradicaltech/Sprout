<script lang="ts">
  import Avatar from '$lib/components/Avatar.svelte';
  let { data } = $props();
</script>

<svelte:head><title>Parent Dashboard — Sprout</title></svelte:head>

<main class="min-h-screen bg-gray-100 p-6 max-w-3xl mx-auto">
  <header class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-extrabold text-gray-800">Parent Dashboard</h1>
    <a href="/" class="tap rounded-2xl bg-white px-5 flex items-center font-bold text-gray-600 shadow">Kiosk →</a>
  </header>

  <!-- Pending reward requests -->
  {#if data.pending.length}
    <section class="mb-6">
      <h2 class="text-xl font-bold text-gray-700 mb-2">🎁 Reward requests</h2>
      <div class="space-y-2">
        {#each data.pending as r (r.id)}
          <div class="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
            <span class="font-bold">{r.child} wants <em>{r.reward}</em> ({r.cost} ⭐)</span>
            <span class="text-sm text-gray-400">approve in roadmap →</span>
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
        <div class="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
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
        </div>
      {/each}
      {#if data.profiles.length === 0}
        <p class="text-gray-500">No profiles yet. Seed the DB or add one (CRUD UI on the roadmap).</p>
      {/if}
    </div>
  </section>

  <section class="bg-white rounded-2xl shadow p-4 text-sm text-gray-500">
    <p class="font-bold text-gray-700 mb-1">Scaffold note</p>
    Full CRUD for profiles, routines, tasks, rewards and reminders is the next milestone.
    Right now manage data via <code>npm run db:studio</code> (Prisma Studio) or edit
    <code>prisma/seed.js</code>. The kiosk, star ledger, completions, redemptions and
    notifications are already wired end-to-end.
  </section>
</main>
