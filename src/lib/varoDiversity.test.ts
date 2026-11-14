import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWindowStats, EXCLUDED_VARO_TITLES, MIN_SAMPLE_SIZE } from "./varoDiversity";

function at(title: string, isoDate: string) {
  return { title, date: new Date(isoDate) };
}

test("excludes titles in EXCLUDED_VARO_TITLES from total and scoring", () => {
  const assignments = [
    at("1st Dua", "2026-01-01"), at("1st Dua", "2026-02-01"), at("1st Dua", "2026-03-01"),
    at("Eid Namaz Reciter", "2026-04-01"), at("Taliqah Ginan", "2026-05-01"),
  ];
  const result = computeWindowStats(assignments, 4);
  assert.equal(result.total, 3);
});

test("below MIN_SAMPLE_SIZE reports notEnoughData, not a score", () => {
  const assignments = [at("1st Dua", "2026-01-01"), at("1st Dua", "2026-02-01")];
  const result = computeWindowStats(assignments, 4);
  assert.deepEqual(result, { total: 2, notEnoughData: true });
});

test("exactly MIN_SAMPLE_SIZE assignments yields a real score (boundary inclusive)", () => {
  const assignments = [at("1st Dua", "2026-01-01"), at("1st Dua", "2026-02-01"), at("1st Dua", "2026-03-01")];
  const result = computeWindowStats(assignments, 4);
  assert.equal(assignments.length, MIN_SAMPLE_SIZE);
  assert.ok(!("notEnoughData" in result));
});

test("single-type history scores exactly 0 regardless of K or total count", () => {
  const assignments = Array.from({ length: 10 }, (_, i) => at("1st Dua", `2026-0${(i % 9) + 1}-01`));
  const result = computeWindowStats(assignments, 13);
  assert.ok(!("notEnoughData" in result));
  if (!("notEnoughData" in result)) assert.equal(result.score, 0);
});

test("all-excluded-title history reports notEnoughData, not a score of 0", () => {
  const assignments = [
    at("Eid Namaz Reciter", "2026-01-01"),
    at("Eid Namaz Announcement/Gist", "2026-02-01"),
    at("Taliqah Ginan", "2026-03-01"),
  ];
  const result = computeWindowStats(assignments, 4);
  assert.deepEqual(result, { total: 0, notEnoughData: true });
});

test("even split across all K distinct titles scores exactly 100", () => {
  const assignments = [at("1st Dua", "2026-01-01"), at("2nd Dua", "2026-02-01"), at("Farman", "2026-03-01"), at("Announcements", "2026-04-01")];
  const result = computeWindowStats(assignments, 4);
  assert.ok(!("notEnoughData" in result));
  if (!("notEnoughData" in result)) assert.equal(result.score, 100);
});

test("topVaro and topVaroPct identify the most frequent non-excluded title", () => {
  const assignments = [
    at("2nd Dua", "2026-01-01"), at("2nd Dua", "2026-02-01"), at("2nd Dua", "2026-03-01"), at("Farman", "2026-04-01"),
  ];
  const result = computeWindowStats(assignments, 4);
  assert.ok(!("notEnoughData" in result));
  if (!("notEnoughData" in result)) {
    assert.equal(result.topVaro, "2nd Dua");
    assert.equal(result.topVaroPct, 75);
  }
});
