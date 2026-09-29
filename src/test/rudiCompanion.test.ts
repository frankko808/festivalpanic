import { beforeEach, describe, expect, it } from "vitest";
import { createRudiCompanionDialogue } from "../data/dialogues/rudiCompanion";
import { gameState } from "../state/GameState";

function dialogueText(index: number): string {
  const script = createRudiCompanionDialogue(gameState.current, index, "market");
  return Object.values(script.nodes).map((node) => node.text).join(" ");
}

describe("Rudi als ansprechbarer Begleiter", () => {
  beforeEach(() => gameState.resetRun());

  it("zählt Begleitergespräche zentral über Kartenwechsel hinweg", () => {
    expect(gameState.recordRudiConversation()).toBe(0);
    expect(gameState.recordRudiConversation()).toBe(1);
    expect(gameState.current.companion.rudiConversationCount).toBe(2);
  });

  it("gibt zuerst einen zum Spielstand passenden Hinweis", () => {
    gameState.completeRudiMeeting();
    expect(dialogueText(0)).toContain("Bürgermeisterin");
  });

  it("wechselt nach häufigem Ansprechen zu humorvollen Meta-Kommentaren", () => {
    expect(dialogueText(3)).toContain("Die Zeit läuft");
    expect(dialogueText(5)).toContain("jede meiner Antworten");
    expect(dialogueText(9)).toContain("Gespräch Nummer 10");
  });
});
