<script lang="ts">
  import Avatar from '$lib/components/Avatar.svelte';
  let { data } = $props();
</script>

<svelte:head><title>Sprout — Who's here?</title></svelte:head>

<main class="min-h-screen bg-gradient-to-b from-sunrise-soft to-white p-6 flex flex-col">
  <header class="flex items-center justify-between mb-8">
    <h1 class="text-4xl font-extrabold text-sunrise">🌱 Sprout</h1>
    <a href="/parent" class="tap rounded-2xl bg-white/70 px-5 flex items-center text-lg font-bold text-gray-600 shadow">
      Parents
    </a>
  </header>

  <h2 class="text-3xl font-bold text-gray-700 mb-6">Who's here?</h2>

  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
    {#each data.profiles as p (p.id)}
      <a
        href={`/kiosk/${p.id}`}
        class="tap rounded-3xl bg-white shadow-lg p-6 flex flex-col items-center gap-3 active:scale-95 transition"
      >
        <Avatar key={p.avatar} size={96} />
        <span class="text-2xl font-bold text-gray-800">{p.name}</span>
        <span class="text-lg text-amber-500 font-bold">⭐ {p.stars}</span>
      </a>
    {/each}

    {#if data.profiles.length === 0}
      <a href="/parent" class="col-span-full rounded-3xl border-4 border-dashed border-sunrise/50 p-10 text-center text-xl font-bold text-gray-500">
        No profiles yet — tap <span class="text-sunrise">Parents</span> to add your first child.
      </a>
    {/if}
  </div>
</main>
