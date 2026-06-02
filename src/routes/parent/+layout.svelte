<script lang="ts">
  import ParentNav from '$lib/components/ParentNav.svelte';
  import { page } from '$app/state';
  let { children } = $props();
  // The login page is shown standalone (no nav / gate not yet passed).
  const isLogin = $derived(page.url.pathname.endsWith('/login'));
</script>

{#if isLogin}
  {@render children()}
{:else}
  <main class="min-h-screen bg-gray-100 p-4 sm:p-6">
    <div class="max-w-3xl mx-auto">
      <ParentNav />
      {@render children()}
    </div>
  </main>
{/if}
