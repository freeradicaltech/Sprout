/** Local calendar day as "YYYY-MM-DD" (kiosk + completions key off this). */
export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Day-of-week index, 0 = Sunday, matching Routine.activeDays. */
export function dow(d = new Date()): number {
  return d.getDay();
}

export function isActiveToday(activeDays: string, d = new Date()): boolean {
  return activeDays.split(',').includes(String(dow(d)));
}

export const AVATARS = ['fox', 'panda', 'rocket', 'unicorn', 'dino', 'cat', 'robot', 'owl'] as const;
export const THEMES = ['sunrise', 'ocean', 'forest', 'grape'] as const;
export const TASK_ICONS = [
  'toothbrush', 'shirt', 'bed', 'backpack', 'plate', 'shower', 'book', 'broom', 'dog', 'star'
] as const;
