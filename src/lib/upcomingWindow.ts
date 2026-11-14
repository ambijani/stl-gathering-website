export const UPCOMING_WINDOW_DAYS = 30;

export function getUpcomingWindow(now: Date): { start: Date; end: Date } {
  return { start: now, end: new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000) };
}
