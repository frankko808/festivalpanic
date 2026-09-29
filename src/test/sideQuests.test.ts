import { beforeEach, describe, expect, it } from "vitest";
import { gameState } from "../state/GameState";

describe("side quests", () => {
  beforeEach(() => gameState.resetRun());

  it("completes the bakery delivery only after it was accepted", () => {
    expect(gameState.completeSideQuest("bakeryDelivery", 50)).toBe(false);
    expect(gameState.startSideQuest("bakeryDelivery")).toBe(true);
    expect(gameState.completeSideQuest("bakeryDelivery", 50)).toBe(true);
    expect(gameState.current.score).toBe(50);
    expect(gameState.completeSideQuest("bakeryDelivery", 50)).toBe(false);
  });

  it("requires all three distinct fountain coins", () => {
    gameState.startSideQuest("fountainCoins");
    expect(gameState.collectFountainCoin("town")).toBe(true);
    expect(gameState.collectFountainCoin("town")).toBe(false);
    expect(gameState.collectFountainCoin("park")).toBe(true);
    expect(gameState.completeFountainCoins()).toBe(false);
    expect(gameState.collectFountainCoin("kai")).toBe(true);
    expect(gameState.current.sideQuests.fountainCoins).toBe("ready");
    expect(gameState.completeFountainCoins()).toBe(true);
    expect(gameState.current.score).toBe(60);
  });

  it("unlocks turbo only after the third encounter with Minka", () => {
    expect(gameState.current.flags.turboUnlocked).toBe(false);
    expect(gameState.advanceMissingCatChase()).toBeUndefined();
    expect(gameState.startSideQuest("missingCat")).toBe(true);
    expect(gameState.completeSideQuest("missingCat", 75)).toBe(false);
    expect(gameState.advanceMissingCatChase()).toBe(1);
    expect(gameState.advanceMissingCatChase()).toBe(2);
    expect(gameState.current.flags.turboUnlocked).toBe(false);
    expect(gameState.advanceMissingCatChase()).toBe(3);
    expect(gameState.current.sideQuests.missingCat).toBe("complete");
    expect(gameState.current.flags.turboUnlocked).toBe(true);
    expect(gameState.current.score).toBe(75);
    expect(gameState.advanceMissingCatChase()).toBeUndefined();
    expect(gameState.current.score).toBe(75);
  });

  it("chooses a fresh route of distinct hiding places for Minka", () => {
    expect(gameState.startSideQuest("missingCat")).toBe(true);
    const route = gameState.current.sideQuests.missingCatSpotOrder;
    expect(route).toHaveLength(5);
    expect(new Set(route)).toHaveLength(5);
    route.forEach((spot) => expect(spot).toBeGreaterThanOrEqual(0));
    route.forEach((spot) => expect(spot).toBeLessThan(8));
  });

  it("tracks every group favor independently", () => {
    gameState.startFavor("green-local");
    ["a", "b", "c", "d"].forEach((id) => gameState.collectTrash(id));
    expect(gameState.getFavorStatus("green-local")).toBe("ready");
    expect(gameState.depositTrash()).toBe(true);
    expect(gameState.getFavorStatus("green-local")).toBe("complete");
    expect(gameState.getFavorStatus("young-list")).toBe("locked");
  });

  it("keeps collected receipts unique across repeated scene visits", () => {
    gameState.startFavor("budget-hawks");
    expect(gameState.collectReceipt("receipt-0")).toBe(true);
    expect(gameState.collectReceipt("receipt-0")).toBe(false);
    expect(gameState.current.favors.receiptsCollected).toEqual(["receipt-0"]);
    expect(gameState.collectReceipt("receipt-1")).toBe(true);
    expect(gameState.collectReceipt("receipt-2")).toBe(true);
    expect(gameState.getFavorStatus("budget-hawks")).toBe("ready");
    expect(gameState.collectReceipt("receipt-1")).toBe(false);
    expect(gameState.current.favors.receiptsCollected).toEqual(["receipt-0", "receipt-1", "receipt-2"]);
  });
});
