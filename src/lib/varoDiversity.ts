export const EXCLUDED_VARO_TITLES: ReadonlySet<string> = new Set([
  "Eid Namaz Reciter",
  "Eid Namaz Announcement/Gist",
  "Taliqah Ginan",
]);

export const MIN_SAMPLE_SIZE = 3;

export type VaroAssignment = { title: string; date: Date };

export type DiversityWindowStats =
  | { total: number; score: number; topVaro: string; topVaroPct: number }
  | { total: number; notEnoughData: true };

export function computeWindowStats(assignments: VaroAssignment[], distinctTitleCount: number): DiversityWindowStats {
  const filtered = assignments.filter(a => !EXCLUDED_VARO_TITLES.has(a.title));
  const total = filtered.length;

  if (total < MIN_SAMPLE_SIZE) {
    return { total, notEnoughData: true };
  }

  const counts = new Map<string, number>();
  for (const a of filtered) {
    counts.set(a.title, (counts.get(a.title) ?? 0) + 1);
  }

  let entropy = 0;
  let topVaro = "";
  let topCount = 0;
  for (const [title, count] of counts) {
    const p = count / total;
    entropy -= p * Math.log2(p);
    if (count > topCount) {
      topCount = count;
      topVaro = title;
    }
  }

  const score = distinctTitleCount > 1 ? Math.round((100 * entropy) / Math.log2(distinctTitleCount)) : 0;
  const topVaroPct = Math.round((100 * topCount) / total);

  return { total, score, topVaro, topVaroPct };
}
