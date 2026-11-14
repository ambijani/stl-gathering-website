import { test } from "node:test";
import assert from "node:assert/strict";
import { getUpcomingWindow, UPCOMING_WINDOW_DAYS } from "./upcomingWindow";

test("getUpcomingWindow's start is exactly now", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const { start } = getUpcomingWindow(now);
  assert.equal(start.getTime(), now.getTime());
});

test("getUpcomingWindow's end is exactly UPCOMING_WINDOW_DAYS days after now", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const { end } = getUpcomingWindow(now);
  assert.equal(end.getTime(), now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
});
