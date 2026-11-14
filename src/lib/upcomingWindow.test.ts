import { test } from "node:test";
import assert from "node:assert/strict";
import { getUpcomingWindow, UPCOMING_WINDOW_DAYS } from "./upcomingWindow";

test("getUpcomingWindow's start is midnight UTC of now's calendar day, not the exact instant", () => {
  const now = new Date("2026-01-15T18:30:00.000Z");
  const { start } = getUpcomingWindow(now);
  assert.equal(start.toISOString(), "2026-01-15T00:00:00.000Z");
});

test("getUpcomingWindow's start stays at midnight UTC when now is already midnight", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const { start } = getUpcomingWindow(now);
  assert.equal(start.getTime(), now.getTime());
});

test("getUpcomingWindow's end is exactly UPCOMING_WINDOW_DAYS days after start", () => {
  const now = new Date("2026-01-15T18:30:00.000Z");
  const { start, end } = getUpcomingWindow(now);
  assert.equal(end.getTime(), start.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
});
