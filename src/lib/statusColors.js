/**
 * Shared status and priority color maps using semantic/chart tokens only.
 * Use these for Badge and inline status styling so the app stays token-first.
 * Colors are tuned to be clearly visible and colorful.
 */

/** Task status → Tailwind classes (chart/muted/destructive tokens) */
export const TASK_STATUS_COLORS = {
  pending: "bg-chart-4/20 text-chart-4 border-chart-4/30 dark:bg-chart-4/25 dark:text-chart-4",
  in_progress: "bg-chart-3/25 text-chart-3 border-chart-3/30 dark:bg-chart-3/30 dark:text-chart-3",
  completed: "bg-chart-2/25 text-chart-2 border-chart-2/30 dark:bg-chart-2/30 dark:text-chart-2",
  review: "bg-chart-1/25 text-chart-1 border-chart-1/30 dark:bg-chart-1/30 dark:text-chart-1",
  waiting: "bg-chart-4/25 text-chart-4 border-chart-4/30 dark:bg-chart-4/30 dark:text-chart-4",
};

/** Task priority → Tailwind classes */
export const PRIORITY_COLORS = {
  urgent: "bg-destructive/25 text-destructive border-destructive/30 dark:bg-destructive/30 dark:text-destructive",
  high: "bg-chart-4/25 text-chart-4 border-chart-4/30 dark:bg-chart-4/30 dark:text-chart-4",
  normal: "bg-chart-3/25 text-chart-3 border-chart-3/30 dark:bg-chart-3/30 dark:text-chart-3",
  low: "bg-chart-5/20 text-chart-5 border-chart-5/30 dark:bg-chart-5/25 dark:text-chart-5",
};

/** Project status → Tailwind classes */
export const PROJECT_STATUS_COLORS = {
  planned: "bg-chart-5/20 text-chart-5 border-chart-5/30 dark:bg-chart-5/25 dark:text-chart-5",
  active: "bg-chart-2/25 text-chart-2 border-chart-2/30 dark:bg-chart-2/30 dark:text-chart-2",
  on_hold: "bg-chart-4/25 text-chart-4 border-chart-4/30 dark:bg-chart-4/30 dark:text-chart-4",
  completed: "bg-chart-3/25 text-chart-3 border-chart-3/30 dark:bg-chart-3/30 dark:text-chart-3",
  cancelled: "bg-destructive/25 text-destructive border-destructive/30 dark:bg-destructive/30 dark:text-destructive",
  archived: "bg-chart-5/20 text-chart-5 border-chart-5/30 dark:bg-chart-5/25 dark:text-chart-5",
};

/** Alias for task status (backward compatibility) */
export const STATUS_COLORS = TASK_STATUS_COLORS;

/** Chart-based palette for type/category badges (no semantic meaning; consistent per name) */
export const TYPE_PALETTE = [
  "bg-chart-1/25 text-chart-1 border-chart-1/30 dark:bg-chart-1/30 dark:text-chart-1",
  "bg-chart-2/25 text-chart-2 border-chart-2/30 dark:bg-chart-2/30 dark:text-chart-2",
  "bg-chart-3/25 text-chart-3 border-chart-3/30 dark:bg-chart-3/30 dark:text-chart-3",
  "bg-chart-4/25 text-chart-4 border-chart-4/30 dark:bg-chart-4/30 dark:text-chart-4",
  "bg-chart-5/25 text-chart-5 border-chart-5/30 dark:bg-chart-5/30 dark:text-chart-5",
];

/**
 * Normalize status name/slug to a key that exists in TASK_STATUS_COLORS when possible.
 */
export function normalizeTaskStatusKey(nameOrSlug) {
  if (!nameOrSlug) return "pending";
  const s = String(nameOrSlug).toLowerCase().trim().replace(/\s+/g, "_");
  if (Object.hasOwn(TASK_STATUS_COLORS, s)) return s;
  const aliases = {
    "in progress": "in_progress",
    "inprogress": "in_progress",
    "done": "completed",
    "blocked": "waiting",
  };
  return aliases[s] ?? s;
}

/**
 * Display label for a task's status (taskStatus.name or legacy status).
 */
export function getTaskStatusDisplay(task) {
  return task?.taskStatus?.name ?? task?.status ?? "—";
}

/**
 * Tailwind class string for a task's status badge. Uses TASK_STATUS_COLORS when the
 * status maps to a known key; otherwise uses a stable color from TYPE_PALETTE.
 */
export function getTaskStatusColor(task) {
  const key = normalizeTaskStatusKey(task?.taskStatus?.name ?? task?.status);
  if (Object.hasOwn(TASK_STATUS_COLORS, key)) return TASK_STATUS_COLORS[key];
  return getProjectTypeColor(task?.taskStatus?.name ?? task?.status);
}

/**
 * Returns a consistent colorful class string for an assignee (developer) badge.
 * Use for Badge className so each assignee has a stable, distinct color.
 */
export function getAssigneeColor(assignee) {
  if (!assignee) return "bg-muted text-muted-foreground border-border";
  const seed = (assignee.id ?? assignee.username ?? assignee.email ?? "").toString();
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i);
  return TYPE_PALETTE[Math.abs(n) % TYPE_PALETTE.length];
}

/**
 * Returns a consistent colorful class string for a project type or category name.
 * Use for Badge className so types/categories are colorful.
 */
export function getProjectTypeColor(typeName) {
  if (!typeName || typeName === "—") return "bg-muted text-muted-foreground border-border";
  let n = 0;
  for (let i = 0; i < String(typeName).length; i++) n += String(typeName).charCodeAt(i);
  return TYPE_PALETTE[Math.abs(n) % TYPE_PALETTE.length];
}
