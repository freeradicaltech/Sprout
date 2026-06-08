import { subscribe } from '$lib/server/bus';
import type { RequestHandler } from './$types';

// Server-Sent Events stream. Kiosks subscribe with ?profile=<id> and reload
// when another device changes that child's data. A periodic comment keeps the
// connection alive through proxies.
export const GET: RequestHandler = ({ url }) => {
  const profile = url.searchParams.get('profile') ?? undefined;
  const enc = new TextEncoder();

  let unsub: (() => void) | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode('retry: 3000\n\n'));
      ping = setInterval(() => {
        try { controller.enqueue(enc.encode(': ping\n\n')); } catch { /* closed */ }
      }, 25000);
      unsub = subscribe((e) => {
        // Filter to this child (household-wide events have no profileId).
        if (profile && e.profileId && e.profileId !== profile) return;
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`)); } catch { /* closed */ }
      });
    },
    cancel() {
      if (ping) clearInterval(ping);
      unsub?.();
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive'
    }
  });
};
