// Self-hosted push via ntfy (https://ntfy.sh / your own server).
// Replaces Nelli's cloud email alerts. Configure with env vars:
//   NTFY_URL=https://ntfy.your.domain
//   NTFY_TOPIC=sprout
//   NTFY_TOKEN=tk_... (optional, for protected topics)

const URL = process.env.NTFY_URL;
const TOPIC = process.env.NTFY_TOPIC;
const TOKEN = process.env.NTFY_TOKEN;

// HTTP header values must be Latin-1 (ByteString); emoji/other multibyte chars
// in the Title make fetch throw, so strip them — the icon comes from the named
// `Tags` header anyway. The message body is UTF-8 and is left untouched.
function headerSafe(s: string): string {
  return s.replace(/[^ -ÿ]/g, '').trim();
}

export async function notify(title: string, message: string, tags: string[] = []): Promise<void> {
  if (!URL || !TOPIC) return; // notifications optional — no-op if unconfigured
  try {
    await fetch(`${URL.replace(/\/$/, '')}/${TOPIC}`, {
      method: 'POST',
      headers: {
        Title: headerSafe(title) || 'Sprout',
        Tags: tags.map(headerSafe).filter(Boolean).join(','),
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
      },
      body: message
    });
  } catch (err) {
    console.error('[notify] failed:', err);
  }
}
