<script lang="ts">
  let { icon = 'star', size = 48 }: { icon?: string; size?: number } = $props();
  const MAP: Record<string, string> = {
    toothbrush: '🪥', shirt: '👕', bed: '🛏️', backpack: '🎒', plate: '🍽️',
    shower: '🚿', book: '📚', broom: '🧹', dog: '🐕', star: '⭐', gift: '🎁',
    calendar: '📅'
  };
</script>

<span style={`font-size:${size}px;line-height:1`}>{MAP[icon] ?? '✅'}</span>
