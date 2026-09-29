import { beforeEach, describe, expect, it } from "vitest";
import { calculateSupport } from "../data/festivalRules";
import { gameState } from "../state/GameState";

describe("festival test checkpoint", () => {
  beforeEach(() => gameState.resetRun());

  it.each(["small", "large", "newcomer"] as const)("creates a complete majority run for %s", (stage) => {
    gameState.loadFestivalCheckpoint(stage);
    const state = gameState.current;
    expect(state.debugMode).toBe(true);
    expect(state.phase).toBe("festival");
    expect(state.quest.groupsInterviewed).toBe(4);
    expect(state.planning.finalPlan?.stage).toBe(stage);
    expect(calculateSupport(state.planning.finalPlan!, state.quest.negotiationFlags).votes).toBeGreaterThanOrEqual(7);
  });

  it("keeps only the best score for replayable festival games", () => {
    gameState.loadFestivalCheckpoint("large");
    const start = gameState.current.score;
    expect(gameState.recordFestivalActivity("fries", 160)).toBe(160);
    expect(gameState.recordFestivalActivity("fries", 120)).toBe(0);
    expect(gameState.recordFestivalActivity("fries", 200)).toBe(40);
    expect(gameState.current.score).toBe(start + 200);
  });

  it("awards finding Rudi only once", () => {
    gameState.loadFestivalCheckpoint("large");
    expect(gameState.recordFestivalActivity("find-rudi", 500)).toBe(500);
    expect(gameState.recordFestivalActivity("find-rudi", 500)).toBe(0);
    expect(gameState.current.festivalActivities.rudiFound).toBe(true);
  });

  it("starts after three negotiations with a usable majority and unlocked turbo", () => {
    gameState.loadAfterNegotiationsCheckpoint();
    const state = gameState.current;
    expect(state.debugMode).toBe(true);
    expect(state.phase).toBe("negotiation");
    expect(state.quest.groupsInterviewed).toBe(4);
    expect(state.quest.argumentCards).toHaveLength(4);
    expect(state.flags.firstDraftSaved).toBe(true);
    expect(state.quest.negotiationTokensRemaining).toBe(0);
    expect(Object.values(state.quest.groupsNegotiated).filter(Boolean)).toHaveLength(3);
    expect(state.planning.finalPlan).toBeUndefined();
    expect(state.council.outcome).toBe("pending");
    expect(state.sideQuests.missingCat).toBe("complete");
    expect(state.flags.turboUnlocked).toBe(true);
    expect(calculateSupport({
      endTime: 23,
      stage: "large",
      security: "extra-team",
      cups: "deposit",
      localShare: 50,
    }, state.quest.negotiationFlags).hasMajority).toBe(true);
  });
});
