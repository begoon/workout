export const EXERCISES = ["chins", "ohp", "pushup", "dips", "curls"] as const;
export type Exercise = (typeof EXERCISES)[number];
