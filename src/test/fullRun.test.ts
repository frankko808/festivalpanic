import { beforeEach, describe, expect, it } from "vitest";
import { calculateSupport, type FestivalPlan } from "../data/festivalRules";
import { resolveNegotiation } from "../data/negotiations";
import { gameState } from "../state/GameState";

const draft: FestivalPlan = { endTime: 22, stage: "small", security: "standard", cups: "single-use", localShare: 0 };
const finalPlan: FestivalPlan = { endTime: 23, stage: "large", security: "extra-team", cups: "deposit", localShare: 75 };

function reachCouncil(): void {
  gameState.completeRudiMeeting();
  gameState.completeMayorMeeting();
  expect(gameState.startFavor("green-local")).toBe(true);
  for (let index = 0; index < 4; index += 1) expect(gameState.collectTrash(`trash-${index}`)).toBe(true);
  expect(gameState.depositTrash()).toBe(true);
  expect(gameState.startFavor("budget-hawks")).toBe(true);
  for (let index = 0; index < 3; index += 1) expect(gameState.collectReceipt(`receipt-${index}`)).toBe(true);
  expect(gameState.completeFavor("budget-hawks", 100)).toBe(true);
  expect(gameState.startSideQuest("missingCat")).toBe(true);
  for (let index = 1; index <= 3; index += 1) expect(gameState.advanceMissingCatChase()).toBe(index);
  expect(gameState.current.flags.turboUnlocked).toBe(true);
  expect(gameState.completeGroupInterview("young-list", "youth-culture")).toBe(true);
  expect(gameState.completeGroupInterview("citizens-forum", "resident-protection")).toBe(true);
  expect(gameState.completeGroupInterview("green-local", "sustainability")).toBe(true);
  expect(gameState.completeGroupInterview("budget-hawks", "budget-discipline")).toBe(true);
  expect(gameState.completeGroupSummary("seek-compromise")).toBe(true);
  expect(calculateSupport(draft).hasMajority).toBe(false);
  expect(gameState.saveFirstFestivalDraft(draft)).toBe(true);
  expect(gameState.startNegotiationQuest()).toBe(true);
  expect(gameState.completeNegotiation("young-list", resolveNegotiation("young-list", "resident-protection", "mia:23"))).toBe(true);
  expect(gameState.completeNegotiation("citizens-forum", resolveNegotiation("citizens-forum", "youth-culture"))).toBe(true);
  expect(gameState.completeNegotiation("green-local", resolveNegotiation("green-local", "budget-discipline"))).toBe(true);
  expect(gameState.saveFinalFestivalPlan(finalPlan)).toBe(true);
}

describe("vollständiger Spielzustands-Ablauf", () => {
  beforeEach(() => gameState.resetRun());

  it("führt von Rudi über Aufgaben, vier Gruppen und Verhandlungen zum Festival und Outro", () => {
    reachCouncil();
    const votes = calculateSupport(finalPlan, gameState.current.quest.negotiationFlags).votes;
    expect(votes).toBeGreaterThanOrEqual(7);
    expect(gameState.recordCouncilVote(votes)).toBe("passed");
    expect(gameState.current.phase).toBe("festival");
    expect(gameState.recordFestivalActivity("fries", 80)).toBe(80);
    expect(gameState.recordFestivalActivity("cans", 40)).toBe(40);
    expect(gameState.recordFestivalActivity("find-rudi", 500)).toBe(500);
    gameState.completeFestivalMayorConversation();
    gameState.setPhase("results");
    expect(gameState.current.flags.festivalMayorConversationComplete).toBe(true);
    expect(gameState.current.score).toBeGreaterThan(2_000);
  });

  it("endet auch nach zwei abgelehnten Abstimmungen ohne Sackgasse", () => {
    reachCouncil();
    expect(gameState.recordCouncilVote(0)).toBe("amendment");
    expect(gameState.saveFinalFestivalPlan(finalPlan)).toBe(true);
    expect(gameState.recordCouncilVote(0)).toBe("rescued");
    const rescuedPlan = gameState.current.planning.finalPlan;
    expect(rescuedPlan).toBeDefined();
    expect(calculateSupport(rescuedPlan!, gameState.current.quest.negotiationFlags).votes).toBeGreaterThanOrEqual(7);
    expect(gameState.current.phase).toBe("festival");
  });
});
