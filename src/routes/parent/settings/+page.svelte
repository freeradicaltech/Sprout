<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<svelte:head><title>Settings — Sprout</title></svelte:head>

<h1 class="text-3xl font-extrabold text-gray-800 mb-4">Settings</h1>

{#if form?.ok}
  <p class="bg-forest-soft text-forest font-bold rounded-xl p-3 mb-4">
    {form.renamed ? 'Family name saved.' : form.cleared ? 'PIN removed — parent area is now open.' : form.pinUpdated ? 'PIN updated.' : 'Saved.'}
  </p>
{/if}

<!-- Family name -->
<form method="POST" action="?/rename" use:enhance class="bg-white rounded-2xl shadow p-5 mb-4 space-y-3">
  <h2 class="font-bold text-gray-700">Family name</h2>
  <input name="name" value={data.name} class="w-full rounded-xl border-2 border-gray-200 p-3" />
  <button class="tap rounded-xl bg-forest text-white px-6 font-bold">Save</button>
</form>

<!-- Parent PIN -->
<form method="POST" action="?/setPin" use:enhance class="bg-white rounded-2xl shadow p-5 mb-4 space-y-3">
  <h2 class="font-bold text-gray-700">Parent PIN {data.pinSet ? '(set)' : '(not set)'}</h2>
  <p class="text-sm text-gray-500">4–8 digits. Leave both fields blank and save to remove the PIN.</p>
  <input name="pin" type="password" inputmode="numeric" placeholder="New PIN" class="w-full rounded-xl border-2 border-gray-200 p-3 tracking-widest" />
  <input name="confirm" type="password" inputmode="numeric" placeholder="Confirm PIN" class="w-full rounded-xl border-2 border-gray-200 p-3 tracking-widest" />
  {#if form?.error}<p class="text-red-500 font-bold">{form.error}</p>{/if}
  <button class="tap rounded-xl bg-sunrise text-white px-6 font-bold">Update PIN</button>
</form>

<!-- Lock session -->
<form method="POST" action="?/lock" use:enhance class="bg-white rounded-2xl shadow p-5">
  <h2 class="font-bold text-gray-700 mb-2">Session</h2>
  <button class="tap rounded-xl bg-gray-200 text-gray-700 px-6 font-bold">🔒 Lock parent area now</button>
</form>
