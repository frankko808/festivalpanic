import { beforeEach, describe, expect, it } from "vitest";
import { gameState } from "../state/GameState";
import { getHudObjective } from "../ui/hudObjective";

describe("next objective in the HUD", () => {
  beforeEach(() => gameState.resetRun());
  it("guides a new run to Rudi and then to the mayor", () => {
    expect(getHudObjective(gameState.current, "TownScene")).toContain("Rudi");
    gameState.current.flags.rudiFirstMeetingComplete = true;
    expect(getHudObjective(gameState.current, "TownScene")).toContain("Bürgermeisterin");
  });
  it("shows the local collection step and switches to handing it in", () => {
    gameState.loadAfterNegotiationsCheckpoint();
    gameState.current.favors.status["green-local"] = "active";
    gameState.current.favors.trashCollected = ["trash-1", "trash-2"];
    expect(getHudObjective(gameState.current, "ParkScene")).toBe("Parkmüll sammeln · 2/4");
    gameState.current.favors.status["green-local"] = "ready";
    expect(getHudObjective(gameState.current, "ParkScene")).toContain("abgeben");
    expect(getHudObjective(gameState.current, "TownHallScene")).toContain("Finalen Festivalplan");
  });
  it("keeps festival guidance to a single next step", () => {
    gameState.loadFestivalCheckpoint();
    expect(getHudObjective(gameState.current, "FestivalScene")).toBe("Mit der Bürgermeisterin sprechen");
    gameState.current.flags.festivalMayorConversationComplete = true;
    expect(getHudObjective(gameState.current, "FestivalScene")).toBe("Festival erkunden · Abschluss am Stern");
  });
});
