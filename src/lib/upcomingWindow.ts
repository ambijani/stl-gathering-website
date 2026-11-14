export const UPCOMING_WINDOW_DAYS = 30;

export function getUpcomingWindow(now: Date): { start: Date; end: Date } {
  // Start at midnight UTC of now's calendar day, not the exact instant: a gathering stored
  // earlier in the day (e.g. at local noon) shouldn't drop out of the window partway through
  // the day it's happening.
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { start, end: new Date(start.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000) };
}
