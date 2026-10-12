import { beforeEach, describe, expect, it } from "vitest";
import { createHaythanDialogue } from "../data/dialogues/haythan";
import { DialogueController } from "../dialogue/DialogueController";
import { gameState } from "../state/GameState";

describe("Haythan am Steg", () => {
  beforeEach(() => gameState.resetRun());

  it("wechselt erst beim nächsten Ansprechen zur zweiten Antwort", () => {
    const first = new DialogueController(createHaythanDialogue(gameState.recordHaythanConversation()));
    expect(first.current.speaker).toBe("Haythan");
    expect(first.current.text).toBe("Ich hatte eine 1 im Test, deshalb kann ich hier chillen.");
    expect(first.advance()).toBe("complete");

    for (let conversation = 0; conversation < 3; conversation += 1) {
      const repeat = new DialogueController(createHaythanDialogue(gameState.recordHaythanConversation()));
      expect(repeat.current.text).toBe("Hattest du auch eine 1? Nein? Dann rede nicht mit mir.");
    }
    expect(gameState.current.score).toBe(0);
  });

  it("beginnt in einem neuen Durchgang wieder mit der ersten Antwort", () => {
    gameState.recordHaythanConversation();
    gameState.resetRun();
    expect(gameState.recordHaythanConversation()).toBe(false);
  });
});
