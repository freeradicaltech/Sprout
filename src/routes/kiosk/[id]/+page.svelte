<script lang="ts">
  import confetti from 'canvas-confetti';
  import { onMount, onDestroy } from 'svelte';
  import TaskIcon from '$lib/components/TaskIcon.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

  type KioskTask = {
    id: string;
    title: string;
    icon: string;
    type: 'CHECKLIST' | 'TIMED' | 'NOTIFICATION';
    stars: number;
    durationSec: number | null;
    promptTime: string | null;
    done: boolean;
  };

  let { data } = $props();

  // Stable per-tab id so this device ignores the live-sync echo of its own changes.
  const clientId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Math.random());

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

  // `onDone` fires when the utterance finishes (or immediately if TTS is
  // unavailable) — used to gate the timer countdown on the intro voiceover.
  // `queue: true` does NOT cancel current speech, so simultaneous prompts are
  // spoken one after another instead of clobbering each other.
  function speak(text: string, opts: { onDone?: () => void; queue?: boolean } = {}) {
    try {
      if (typeof speechSynthesis === 'undefined') { opts.onDone?.(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.1;
      if (opts.onDone) { u.onend = () => opts.onDone!(); u.onerror = () => opts.onDone!(); }
      if (!opts.queue) speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { opts.onDone?.(); }
  }

  async function complete(task: KioskTask, opts: { silent?: boolean } = {}) {
    if (task.done) return;
    task.done = true; // optimistic
    stars += task.stars;

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    if (!opts.silent) speak(`Great job ${data.profile.name}! ${task.title} done.`);

    const res = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, profileId: data.profile.id, client: clientId })
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

  // ── Timed tasks ──────────────────────────────────────────────
  // A fullscreen countdown for TIMED tasks. Auto-completes at zero.
  let timer = $state<{ task: KioskTask; total: number; remaining: number; starting: boolean } | null>(null);
  let timerHandle: ReturnType<typeof setInterval> | null = null;

  const timerPct = $derived(timer ? (timer.remaining / timer.total) * 100 : 0);

  function fmt(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function startTimer(task: KioskTask) {
    const total = task.durationSec && task.durationSec > 0 ? task.durationSec : 60;
    timer = { task, total, remaining: total, starting: true };
    if (timerHandle) clearInterval(timerHandle);

    // Begin the countdown only once the intro voiceover has finished, so the
    // clock doesn't tick during "Ready, set, go!". Guarded against double-start
    // and against the timer being cancelled/changed while speaking.
    let began = false;
    const begin = () => {
      if (began) return;
      began = true;
      if (!timer || timer.task.id !== task.id) return;
      timer.starting = false;
      timerHandle = setInterval(() => {
        if (!timer) return;
        timer.remaining -= 1;
        if (timer.remaining <= 0) finishTimer(true);
      }, 1000);
    };

    speak(`Okay ${data.profile.name}, let's do ${task.title}. Ready, set, go!`, { onDone: begin });
    // Fallback: if TTS never signals completion (unsupported/muted), start anyway.
    setTimeout(begin, 6000);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  async function finishTimer(reachedZero: boolean) {
    const t = timer?.task;
    stopTimer();
    timer = null;
    if (!t) return;
    if (reachedZero) speak(`Time's up! Awesome work ${data.profile.name}!`);
    await complete(t, { silent: true });
  }

  function cancelTimer() {
    stopTimer();
    timer = null;
  }

  // ── Scheduled voice prompts ──────────────────────────────────
  // Tasks with a promptTime ("HH:MM") get a by-name voice nudge + banner
  // when their time arrives. Fires once per task per page session.
  const fired = new Set<string>();
  let promptHandle: ReturnType<typeof setInterval> | null = null;
  let banner = $state<{ title: string; icon: string } | null>(null);

  function nowHHMM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // Local calendar day (YYYY-MM-DD) from the client clock. Captured at load so a
  // kiosk left open across midnight reloads itself to pick up the daily reset.
  function clientDay() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const loadedDay = clientDay();

  function checkDayRollover() {
    if (clientDay() !== loadedDay) location.reload();
  }

  function checkPrompts() {
    const hhmm = nowHHMM();
    for (const r of routines) {
      for (const t of r.tasks as KioskTask[]) {
        if (t.done || !t.promptTime) continue;
        const key = `${t.id}@${t.promptTime}`;
        if (t.promptTime === hhmm && !fired.has(key)) {
          fired.add(key);
          banner = { title: t.title, icon: t.icon };
          // queue: don't cancel — if several prompts fire at the same minute
          // they're spoken back-to-back rather than cutting each other off.
          speak(`${data.profile.name}, it's time to ${t.title}.`, { queue: true });
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.3 } });
          setTimeout(() => {
            if (banner && banner.title === t.title) banner = null;
          }, 20000);
        }
      }
    }
  }

  async function uncomplete(task: KioskTask) {
    if (!task.done) return;
    if (!confirm(`Undo "${task.title}"?`)) return;
    task.done = false; // optimistic
    stars -= task.stars;
    speak(`Okay, ${task.title} is not done yet.`);

    const res = await fetch('/api/uncomplete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, profileId: data.profile.id, client: clientId })
    });
    if (!res.ok) {
      task.done = true; // rollback
      stars += task.stars;
    } else {
      const j = await res.json();
      if (typeof j.stars === 'number') stars = j.stars;
    }
  }

  function onTaskClick(task: KioskTask) {
    if (task.done) {
      uncomplete(task);
      return;
    }
    if (task.type === 'TIMED') startTimer(task);
    else complete(task);
  }

  // ── Live multi-device sync ───────────────────────────────────
  // Subscribe to server events for this child; when another device changes
  // something, refresh. Ignore our own echoes and don't interrupt a countdown.
  let es: EventSource | null = null;

  function startSync() {
    try {
      es = new EventSource(`/api/events?profile=${data.profile.id}`);
      es.onmessage = (ev) => {
        let e: { source?: string } = {};
        try { e = JSON.parse(ev.data); } catch { return; }
        if (e.source === clientId) return; // our own change
        if (timer) return; // don't yank a child out of a running countdown
        location.reload();
      };
    } catch { /* SSE unsupported — sync simply off */ }
  }

  onMount(() => {
    checkPrompts();
    promptHandle = setInterval(() => {
      checkDayRollover();
      checkPrompts();
    }, 15000);
    startSync();
  });

  onDestroy(() => {
    stopTimer();
    if (promptHandle) clearInterval(promptHandle);
    es?.close();
  });

  let shopOpen = $state(false);
  let message = $state('');

  async function redeem(reward: { id: string; title: string; cost: number }) {
    if (stars < reward.cost) {
      message = `You need ${reward.cost - stars} more ⭐ for ${reward.title}`;
      speak(`Almost there! Keep earning stars.`);
      return;
    }
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rewardId: reward.id, profileId: data.profile.id, client: clientId })
    });
    if (res.ok) {
      const j = await res.json();
      if (typeof j.stars === 'number') stars = j.stars;
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      speak(`Yay! You asked for ${reward.title}. Ask a grown-up!`);
      message = `🎉 Requested "${reward.title}" — ask a grown-up!`;
    } else {
      message = 'Could not redeem right now.';
    }
  }
</script>

<svelte:head><title>{data.profile.name} — Sprout</title></svelte:head>

<main class={`min-h-screen bg-gradient-to-b ${themeBg[data.profile.theme] ?? 'from-sunrise-soft'} to-white p-6`}>
  {#if banner}
    <div class="fixed top-4 inset-x-4 z-40 rounded-2xl bg-grape text-white shadow-xl p-4 flex items-center gap-3 pop">
      <TaskIcon icon={banner.icon} size={40} />
      <div class="text-xl font-extrabold">🔔 {data.profile.name}, time to {banner.title}!</div>
      <button class="ml-auto tap rounded-xl bg-white/20 px-4 font-bold" onclick={() => (banner = null)}>OK</button>
    </div>
  {/if}

  <header class="flex items-center justify-between mb-6">
    <a href="/" class="tap rounded-2xl bg-white/70 px-5 flex items-center text-2xl shadow">←</a>
    <div class="flex items-center gap-3">
      <Avatar key={data.profile.avatar} size={64} />
      <h1 class="text-3xl font-extrabold text-gray-800">Hi {data.profile.name}!</h1>
    </div>
    <button
      class="tap rounded-2xl bg-amber-100 px-5 flex items-center text-2xl font-extrabold text-amber-600 shadow active:scale-95"
      onclick={() => (shopOpen = !shopOpen)}
    >
      ⭐ {stars} 🎁
    </button>
  </header>

  {#if shopOpen}
    <section class="rounded-3xl bg-white shadow-lg p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-2xl font-extrabold text-grape">🎁 Reward Shop</h2>
        <button class="tap rounded-xl bg-gray-100 px-4 font-bold text-gray-500" onclick={() => (shopOpen = false)}>Close</button>
      </div>
      {#if message}<p class="text-lg font-bold text-amber-600 mb-3">{message}</p>{/if}
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {#each data.rewards as reward (reward.id)}
          <button
            class={`tap rounded-2xl p-4 flex flex-col items-center gap-2 shadow active:scale-95 transition ${
              stars >= reward.cost ? 'bg-grape-soft' : 'bg-gray-100 opacity-70'
            }`}
            onclick={() => redeem(reward)}
          >
            <TaskIcon icon={reward.icon} size={44} />
            <span class="font-bold text-gray-800 text-center">{reward.title}</span>
            <span class="text-amber-500 font-bold">{reward.cost} ⭐</span>
          </button>
        {/each}
        {#if data.rewards.length === 0}
          <p class="col-span-full text-gray-400 text-center">No rewards yet.</p>
        {/if}
      </div>
    </section>
  {/if}

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
            onclick={() => onTaskClick(task)}
          >
            <TaskIcon icon={task.icon} size={56} />
            <span class="text-xl font-bold text-gray-800 text-center">{task.title}</span>
            {#if task.done}
              <span class="text-3xl">✅</span>
              <span class="text-xs text-gray-400 font-bold">tap to undo</span>
            {:else if task.type === 'TIMED'}
              <span class="text-ocean font-bold">⏱ {task.durationSec ? fmt(task.durationSec) : '1:00'}</span>
              <span class="text-amber-500 font-bold text-sm">+{task.stars} ⭐</span>
            {:else}
              {#if task.promptTime}
                <span class="text-grape font-bold text-sm">🔔 {task.promptTime}</span>
              {/if}
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

  {#if timer}
    <div class="fixed inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center gap-8 p-6">
      <h2 class="text-4xl font-extrabold text-white text-center flex items-center gap-3">
        <TaskIcon icon={timer.task.icon} size={56} /> {timer.task.title}
      </h2>

      <div class="relative h-72 w-72">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke="#34d399" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="282.74"
            stroke-dashoffset={282.74 * (1 - timerPct / 100)}
            style="transition: stroke-dashoffset 1s linear"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          {#if timer.starting}
            <span class="text-4xl font-extrabold text-white animate-pulse">Get ready…</span>
          {:else}
            <span class="text-6xl font-extrabold text-white tabular-nums">{fmt(timer.remaining)}</span>
          {/if}
        </div>
      </div>

      <div class="flex gap-4">
        <button
          class="tap rounded-2xl bg-forest px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95"
          onclick={() => finishTimer(false)}
        >
          I'm done ✅
        </button>
        <button
          class="tap rounded-2xl bg-white/20 px-8 py-4 text-2xl font-bold text-white shadow-lg active:scale-95"
          onclick={cancelTimer}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</main>
