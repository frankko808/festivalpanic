import { calculatePlanCost, calculateSupport, type FestivalPlan, type NegotiationFlags } from "./festivalRules";

export const ACHIEVEMENTS = {
  "peter-zwegert": {
    title: "Peter Zwegert",
    description: "Das Festival für weniger als 20.000 € beschlossen.",
  },
  "unanimous": {
    title: "Alle an einem Tisch",
    description: "Alle zwölf Ratsstimmen für einen Festivalplan gewonnen.",
  },
  "find-rudi": {
    title: "Waschbär-Radar",
    description: "Rudi im Festivaltrubel wiedergefunden.",
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

export function evaluatePlanAchievements(
  plan: FestivalPlan,
  flags: NegotiationFlags,
): AchievementId[] {
  const result: AchievementId[] = [];
  const support = calculateSupport(plan, flags);
  if (calculatePlanCost(plan, flags) < 20_000) result.push("peter-zwegert");
  if (support.votes === 12) result.push("unanimous");
  return result;
}
