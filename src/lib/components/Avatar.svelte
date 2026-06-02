<script lang="ts">
  // Emoji-based avatars keep the scaffold asset-free. Swap for SVG/Lottie later.
  let { key = 'fox', size = 64 }: { key?: string; size?: number } = $props();
  const MAP: Record<string, string> = {
    fox: '🦊', panda: '🐼', rocket: '🚀', unicorn: '🦄',
    dino: '🦕', cat: '🐱', robot: '🤖', owl: '🦉'
  };
</script>

<span
  class="inline-flex items-center justify-center rounded-full bg-gray-100"
  style={`width:${size}px;height:${size}px;font-size:${size * 0.6}px`}
>
  {MAP[key] ?? '🐣'}
</span>
