<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  const links = [
    { href: '/parent', label: 'Dashboard', icon: '📊' },
    { href: '/parent/profiles', label: 'Kids', icon: '👧' },
    { href: '/parent/rewards', label: 'Rewards', icon: '🎁' },
    { href: '/parent/history', label: 'History', icon: '🔥' },
    { href: '/parent/reminders', label: 'Reminders', icon: '📅' },
    { href: '/parent/settings', label: 'Settings', icon: '⚙️' }
  ];
  const active = (href: string) =>
    href === '/parent' ? page.url.pathname === '/parent' : page.url.pathname.startsWith(href);
</script>

<nav class="bg-white rounded-2xl shadow p-2 flex flex-wrap gap-1 mb-6">
  {#each links as l (l.href)}
    <a
      href={l.href}
      class={`tap rounded-xl px-4 flex items-center gap-2 font-bold transition ${
        active(l.href) ? 'bg-sunrise text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span>{l.icon}</span><span class="hidden sm:inline">{l.label}</span>
    </a>
  {/each}
  {#if page.data.pinSet}
    <form method="POST" action="/parent/settings?/lock" use:enhance class="ml-auto">
      <button class="tap rounded-xl px-4 flex items-center gap-2 font-bold text-gray-500 hover:bg-gray-100" title="Lock parent area">🔒 <span class="hidden sm:inline">Lock</span></button>
    </form>
    <a href="/" class="tap rounded-xl px-4 flex items-center gap-2 font-bold text-gray-400 hover:bg-gray-100">
      Kiosk →
    </a>
  {:else}
    <a href="/" class="tap rounded-xl px-4 flex items-center gap-2 font-bold text-gray-400 hover:bg-gray-100 ml-auto">
      Kiosk →
    </a>
  {/if}
</nav>
