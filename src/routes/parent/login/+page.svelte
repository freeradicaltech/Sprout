<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<svelte:head><title>Parent PIN — Sprout</title></svelte:head>

<main class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
  <form method="POST" use:enhance class="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm space-y-5">
    <h1 class="text-2xl font-extrabold text-gray-800">🔒 Parent PIN</h1>
    <input
      name="pin"
      type="password"
      inputmode="numeric"
      autocomplete="off"
      placeholder="••••"
      class="w-full rounded-2xl border-2 border-gray-200 p-4 text-2xl text-center tracking-widest"
    />
    {#if form?.error}<p class="text-red-500 font-bold">{form.error}</p>{/if}
    <button class="tap w-full rounded-2xl bg-sunrise text-white text-xl font-bold">Unlock</button>
    <a href="/" class="block text-center text-gray-400">← Back</a>
  </form>
</main>
