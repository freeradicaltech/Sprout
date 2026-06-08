import { EventEmitter } from 'node:events';

// In-process pub/sub so SSE connections can push live updates to kiosks.
// Single-server deployment only (fine for a homelab); swap for Redis/NATS if
// you ever run multiple app instances.
const emitter = new EventEmitter();
emitter.setMaxListeners(0); // many kiosks may subscribe

export type SyncEvent = {
  /** Which child the change affects; omitted = household-wide. */
  profileId?: string;
  /** What changed: task completion, redemption, etc. */
  kind: 'task' | 'redeem' | 'reward' | 'profile';
  /** Originating client id, so a device can ignore its own echo. */
  source?: string;
  ts: number;
};

export function publish(e: Omit<SyncEvent, 'ts'>): void {
  emitter.emit('sync', { ...e, ts: Date.now() } satisfies SyncEvent);
}

export function subscribe(fn: (e: SyncEvent) => void): () => void {
  emitter.on('sync', fn);
  return () => emitter.off('sync', fn);
}
