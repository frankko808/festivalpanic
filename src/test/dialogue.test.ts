import { describe, expect, it } from "vitest";
import { rudiFirstMeeting } from "../data/dialogues/rudiFirstMeeting";
import { DialogueController } from "../dialogue/DialogueController";

describe("Rudis erste Begegnung", () => {
  it.each([
    [0, "Starker Anfang."],
    [1, "Verfassungsrechtlich nicht abschließend geklärt."],
    [2, "Wir haben nur sechzig Minuten. Akzeptier es."],
  ])("führt Antwort %i vollständig in den gemeinsamen Dialog zurück", (choice, reply) => {
    const dialogue = new DialogueController(rudiFirstMeeting);
    expect(dialogue.current.text).toBe("Hi.");
    expect(dialogue.choose(choice)).toBe("advanced");
    expect(dialogue.current.text).toBe(reply);
    dialogue.advance();
    expect(dialogue.current.text).toBe("Ich bin Rudi.");
    dialogue.advance();
    expect(dialogue.current.text).toBe("Das Sommerfest sollte morgen stattfinden.");
    dialogue.advance();
    expect(dialogue.current.text).toBe("Sollte.");
    expect(dialogue.advance()).toBe("complete");
    expect(dialogue.isFinished).toBe(true);
  });
});
