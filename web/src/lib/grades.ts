export const GRADE_TABLE: Record<string, [string, string]> = {
  "4.5-5.1": ["A+", "Production-Ready Excellence"],
  "4.0-4.5": ["A", "Production-Ready"],
  "3.5-4.0": ["B+", "Good with Minor Issues"],
  "3.0-3.5": ["B", "Acceptable with Improvements Needed"],
  "2.5-3.0": ["C+", "Below Average"],
  "2.0-2.5": ["C", "Significant Issues"],
  "1.5-2.0": ["D", "Major Concerns"],
  "0.0-1.5": ["F", "Critical - Needs Overhaul"],
};

export function getGrade(score: number): [string, string] {
  for (const [range, value] of Object.entries(GRADE_TABLE)) {
    const [low, high] = range.split("-").map(Number);
    if (score >= low && score < high) {
      return value;
    }
  }
  return ["?", "Unknown"];
}
