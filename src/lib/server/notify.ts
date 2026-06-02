// Self-hosted push via ntfy (https://ntfy.sh / your own server).
// Replaces Nelli's cloud email alerts. Configure with env vars:
//   NTFY_URL=https://ntfy.your.domain
//   NTFY_TOPIC=sprout
//   NTFY_TOKEN=tk_... (optional, for protected topics)

const URL = process.env.NTFY_URL;
const TOPIC = process.env.NTFY_TOPIC;
const TOKEN = process.env.NTFY_TOKEN;

export async function notify(title: string, message: string, tags: string[] = []): Promise<void> {
  if (!URL || !TOPIC) return; // notifications optional — no-op if unconfigured
  try {
    await fetch(`${URL.replace(/\/$/, '')}/${TOPIC}`, {
      method: 'POST',
      headers: {
        Title: title,
        Tags: tags.join(','),
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
      },
      body: message
    });
  } catch (err) {
    console.error('[notify] failed:', err);
  }
}
