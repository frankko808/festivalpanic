import type { FestivalPlan } from "./festivalRules";

export type FestivalOutroArt = "voices" | "negotiation" | "council" | "festival";

export interface FestivalOutroMoment {
  art: FestivalOutroArt;
  title: string;
  memory: string;
  insight: string;
}

export interface FestivalOutroSummary {
  groupsInterviewed: number;
  negotiations: number;
  votes: number;
  cost: number;
  plan: FestivalPlan;
}

export function createFestivalOutroMoments(summary: FestivalOutroSummary): FestivalOutroMoment[] {
  const stage = summary.plan.stage === "large"
    ? "großen Bühne"
    : summary.plan.stage === "newcomer"
      ? "Newcomer-Bühne"
      : "kleinen Bühne";
  return [
    {
      art: "voices",
      title: "Vier Perspektiven",
      memory: `Du hast mit ${summary.groupsInterviewed} Gruppen gesprochen. Ihre Wünsche passten nicht alle in denselben ersten Entwurf.`,
      insight: "Politische Gruppen vertreten unterschiedliche Interessen. Zuhören macht diese Unterschiede sichtbar.",
    },
    {
      art: "negotiation",
      title: "Am Verhandlungstisch",
      memory: `${summary.negotiations} konkrete Vereinbarungen haben aus Forderungen einen neuen Festivalplan gemacht.`,
      insight: "Mehrheiten entstehen oft erst, wenn Menschen verhandeln und sich auf überprüfbare Zusagen einigen.",
    },
    {
      art: "council",
      title: "Der Beschluss",
      memory: `${summary.votes} von 12 Ratsstimmen für einen Plan mit ${summary.cost.toLocaleString("de-DE")} Euro Budget.`,
      insight: "Für einen Beschluss braucht es eine Mehrheit. Sie macht die Entscheidung möglich, nicht automatisch perfekt.",
    },
    {
      art: "festival",
      title: "Das Fest gehört allen",
      memory: `Heute feiern die Menschen am Marktplatz mit der ${stage} – auch jene, die nicht jeden Punkt bekommen haben.`,
      insight: "Ein guter Kompromiss berücksichtigt mehrere Interessen, ohne jeden Wunsch vollständig zu erfüllen.",
    },
  ];
}
