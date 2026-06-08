# 🌱 Sprout

**Open-source, self-hosted kids' routine, chore & reward hub.**
A subscription-free alternative to appliance "kid hubs" like the Nelli Smart Hub —
runs on a repurposed tablet pointed at your homelab, with no cloud lock-in.

Kids see big, picture-based morning/bedtime routines, tap tasks to complete them,
earn ⭐ stars with confetti + voice praise, and spend stars on rewards you define.
Parents manage everything from a PIN-protected dashboard and get push notifications
via self-hosted [ntfy](https://ntfy.sh) — no $50/yr parent app required.

> Status: **working beta**. Kiosk, star ledger, task completion, reward shop +
> approval, full parent CRUD, timed-task countdowns, scheduled voice prompts,
> hashed PINs and ntfy notifications are wired end-to-end and running on a LAN
> deployment behind HTTPS. Background prompts, live multi-device sync and a
> history/streaks view are the main items left — see the roadmap below.

---

## Why

Commercial kid-routine hubs bundle a $400+ Android tablet with an app and gate
remote management behind a subscription. The actual software is a structured
to-do app with gamification. Sprout is that app — yours, on hardware you already
own, with your data staying on your LAN/Tailscale.

## Features

- 👧 Unlimited child / teen / parent profiles, each with avatar, theme & sounds
- 🌅 AM / PM / anytime routines, active on chosen days of the week
- ✅ Task types: checklist, timed (countdown), notification (scheduled prompt)
- ⭐ Star ledger (earn / bonus / penalty / redeem) — auditable, not just a counter
- 🎁 Rewards catalogue + redemption requests for parent approval
- 🎉 Confetti + Web Speech voice praise that calls the child by name
- 🔒 PIN-gated parent dashboard with today's progress per child
- 🔔 Optional self-hosted push via ntfy (star earned / reward requested)
- 📱 Installable PWA — full-screen kiosk on any tablet, works offline
- 🐳 Single Docker container, SQLite by default (Postgres-ready)

## Tech stack

SvelteKit (Svelte 5) · Prisma · SQLite · TailwindCSS · adapter-node · Docker.
One language front-to-back, one container to deploy.

---

## Quick start (local dev)

```bash
npm install
cp .env.example .env          # already done if you cloned with one
npm run db:push               # create the SQLite schema
npm run db:seed               # load a demo family (parent PIN: 1234)
npm run dev                   # http://localhost:5173
```

- Kid kiosk: pick a profile on the home screen → tap tasks to complete them.
- Parent dashboard: `/parent` (PIN `1234` from the seed — **change it**).
- Edit data directly any time with `npm run db:studio` (Prisma Studio).

## Run with Docker

```bash
# First run: seed the demo family
SPROUT_SEED=1 docker compose up --build -d
# Then set SPROUT_SEED back to 0 in docker-compose.yml
```

App on `http://<host>:3000`. Data persists in the `sprout-data` volume.

## Deploy on the tablet (kiosk mode)

1. Run Sprout on your homelab; reach it over LAN or Tailscale.
2. On the old tablet, open the URL in Chrome → **Add to Home screen** (installs the PWA).
3. Launch full-screen. For a locked-down kiosk use a free launcher
   (e.g. Fully Kiosk Browser) pointed at the same URL, set to auto-start on boot.

## Notifications (optional)

Point Sprout at your ntfy server and subscribe on your phone:

```env
NTFY_URL=https://ntfy.your.domain
NTFY_TOPIC=sprout
NTFY_TOKEN=tk_xxx   # only if the topic is protected (default-deny servers)
```

Sprout publishes on two events: a ⭐ **star earned** (task completed) and a 🎁
**reward requested** (kid redeems). Subscribe to the topic in the ntfy app to
get them on your phone. Notifications are optional — if `NTFY_URL`/`NTFY_TOPIC`
are unset, the app simply skips them.

---

## Project layout

```
prisma/schema.prisma        Data model (household, profiles, routines, tasks,
                            completions, star ledger, rewards, redemptions, reminders)
prisma/seed.js              Demo family seeder
src/routes/+page.svelte     "Who's here?" profile picker (kiosk home)
src/routes/kiosk/[id]/      Child dashboard — tasks, stars, confetti, voice
src/routes/parent/          PIN-gated parent dashboard
src/routes/api/complete/    Mark task done + award stars (idempotent per day)
src/routes/api/redeem/      Spend stars on a reward (logs redemption)
src/lib/server/             db, stars ledger, ntfy notify
```

## Roadmap (to Nelli parity and beyond)

Shipped:

- [x] Parent CRUD UI: profiles, routines, tasks, rewards, reminders
- [x] Reward approval / deny (with star refund) flow in the dashboard
- [x] Kiosk reward shop — kids spend stars; bonus/penalty stars from parent
- [x] Parent settings: family name, set/change/remove PIN, configurable auto-lock
- [x] Timed-task countdown UI + scheduled NOTIFICATION voice prompts (while kiosk open)
- [x] Edit tasks in place; copy a routine to another child / all kids
- [x] Reorder routines & tasks (up/down controls)
- [x] Live clock on the homescreen; auto-reload at local midnight for the daily reset
- [x] ntfy push (star earned / reward requested)
- [x] Hashed PINs (scrypt) + Secure session cookie behind HTTPS

Next up:

- [ ] Background prompts via service worker (fire scheduled voice/notify when the kiosk tab is closed)
- [ ] History & streaks view per child; weekly summary notification
- [ ] Live multi-device sync (SSE/WebSocket) so several tablets stay current in real time
- [ ] Reward fulfilment tracking + notification when a redemption is approved
- [ ] Themes, per-profile music & richer avatars (SVG/Lottie); drag-handle reordering
- [ ] Per-profile PINs / handoff; optional "teen" feature set
- [ ] Docker/CI polish + public GitHub mirror at MVP

## Security note

The parent PIN is stored hashed (scrypt) and the parent area is gated by a
PIN with a configurable auto-lock. Served behind HTTPS the session cookie is
marked `Secure`. The session is still a single shared cookie (one parent role
per household), which is fine for a single household on a trusted LAN/Tailscale.
Per-profile auth and full session management are on the roadmap; review before
any public internet exposure.

## License

MIT — see [LICENSE](./LICENSE). Contributions welcome.
