<script lang="ts">
  import confetti from 'canvas-confetti';
  import TaskIcon from '$lib/components/TaskIcon.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

  let { data } = $props();

  // Local reactive copy so the UI updates instantly on tap.
  let routines = $state(structuredClone(data.routines));
  let stars = $state(data.profile.stars);

  const themeBg: Record<string, string> = {
    sunrise: 'from-sunrise-soft', ocean: 'from-ocean-soft',
    forest: 'from-forest-soft', grape: 'from-grape-soft'
  };

  const total = $derived(routines.flatMap((r) => r.tasks).length);
  const completed = $derived(routines.flatMap((r) => r.tasks).filter((t) => t.done).length);
  const allDone = $derived(total > 0 && completed === total);

  function speak(text: string) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.1;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { /* TTS unavailable — silent */ }
  }

  async function complete(task: { id: string; title: string; done: boolean; stars: number }) {
    if (task.done) return;
    task.done = true; // optimistic
    stars += task.stars;

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    speak(`Great job ${data.profile.name}! ${task.title} done.`);

    const res = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, profileId: data.profile.id })
    });
    if (!res.ok) {
      task.done = false; // rollback
      stars -= task.stars;
    } else {
      const j = await res.json();
      if (typeof j.stars === 'number') stars = j.stars;
    }

    if (routines.flatMap((r) => r.tasks).every((t) => t.done)) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
      speak(`Amazing ${data.profile.name}! You finished everything!`);
    }
  }
</script>

<svelte:head><title>{data.profile.name} — Sprout</title></svelte:head>

<main class={`min-h-screen bg-gradient-to-b ${themeBg[data.profile.theme] ?? 'from-sunrise-soft'} to-white p-6`}>
  <header class="flex items-center justify-between mb-6">
    <a href="/" class="tap rounded-2xl bg-white/70 px-5 flex items-center text-2xl shadow">←</a>
    <div class="flex items-center gap-3">
      <Avatar key={data.profile.avatar} size={64} />
      <h1 class="text-3xl font-extrabold text-gray-800">Hi {data.profile.name}!</h1>
    </div>
    <div class="tap rounded-2xl bg-amber-100 px-5 flex items-center text-2xl font-extrabold text-amber-600 shadow">
      ⭐ {stars}
    </div>
  </header>

  <!-- Progress bar -->
  <div class="mb-6">
    <div class="h-6 w-full rounded-full bg-white/70 overflow-hidden shadow-inner">
      <div class="h-full bg-forest transition-all duration-500" style={`width:${total ? (completed / total) * 100 : 0}%`}></div>
    </div>
    <p class="text-center mt-2 text-xl font-bold text-gray-600">{completed} / {total} done</p>
  </div>

  {#if allDone}
    <div class="rounded-3xl bg-forest-soft p-6 text-center text-3xl font-extrabold text-forest mb-6 pop">
      🎉 All done! You're a superstar!
    </div>
  {/if}

  {#if data.reminders.length}
    <div class="rounded-2xl bg-white/80 p-4 mb-6 flex gap-3 items-center shadow">
      <TaskIcon icon="calendar" size={32} />
      <div class="font-bold text-gray-700">
        Today: {data.reminders.map((r) => r.title).join(' · ')}
      </div>
    </div>
  {/if}

  {#each routines as routine (routine.id)}
    <section class="mb-8">
      <h2 class="text-2xl font-extrabold text-gray-700 mb-3">
        {routine.slot === 'AM' ? '🌅' : routine.slot === 'PM' ? '🌙' : '⭐'} {routine.name}
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {#each routine.tasks as task (task.id)}
          <button
            class={`tap rounded-3xl p-5 flex flex-col items-center gap-2 shadow-lg active:scale-95 transition ${
              task.done ? 'bg-forest-soft' : 'bg-white'
            }`}
            onclick={() => complete(task)}
          >
            <TaskIcon icon={task.icon} size={56} />
            <span class="text-xl font-bold text-gray-800 text-center">{task.title}</span>
            {#if task.done}
              <span class="text-3xl">✅</span>
            {:else}
              <span class="text-amber-500 font-bold">+{task.stars} ⭐</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}

  {#if total === 0}
    <p class="text-center text-2xl text-gray-500 mt-12">No tasks today — go play! 🎈</p>
  {/if}
</main>
