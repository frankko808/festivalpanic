import type { RunState } from "../state/GameState";

export function getHudObjective(state: Readonly<RunState>, scene: string): string {
  if (state.phase === "festival") return state.flags.festivalMayorConversationComplete
    ? "Festival erkunden · Abschluss am Stern"
    : "Mit der Bürgermeisterin sprechen";
  if (!state.flags.rudiFirstMeetingComplete) return "Rudi am Marktplatz ansprechen";
  if (!state.flags.mayorFirstMeetingComplete) return "Mit der Bürgermeisterin sprechen";
  if (scene === "ParkScene") {
    if (state.favors.status["green-local"] === "active") return `Parkmüll sammeln · ${state.favors.trashCollected.length}/4`;
    if (state.favors.status["green-local"] === "ready") return "Parkmüll am grünen Eimer abgeben";
  }
  if (scene === "TownScene" && state.favors.status["budget-hawks"] === "active") {
    return `Marktbelege sammeln · ${state.favors.receiptsCollected.length}/3`;
  }
  if (state.quest.groupsInterviewed < state.quest.groupsTotal) return `Gruppen befragen · ${state.quest.groupsInterviewed}/${state.quest.groupsTotal} · Orte im Journal`;
  if (!state.flags.groupSummaryComplete) return "Ratssaal: Argumente auswerten";
  if (!state.flags.firstDraftSaved) return "Ratssaal: Ersten Festivalplan erstellen";
  if (!state.quest.negotiationStarted) return "Mit Rudi über Verhandlungen sprechen";
  if (state.quest.negotiationTokensRemaining > 0) return `Verhandeln · ${state.quest.negotiationTokensRemaining}/3 Marken übrig`;
  if (!state.planning.finalPlan) return "Ratssaal: Finalen Festivalplan erstellen";
  return "Ratssaal: Über den Festivalplan abstimmen";
}
