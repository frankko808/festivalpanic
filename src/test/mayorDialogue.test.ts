import { describe, expect, it } from "vitest";
import { mayorFirstMeeting } from "../data/dialogues/mayorFirstMeeting";
import { DialogueController } from "../dialogue/DialogueController";

function reachMayorChoices(): DialogueController {
  const dialogue = new DialogueController(mayorFirstMeeting);
  dialogue.advance();
  dialogue.advance();
  dialogue.advance();
  return dialogue;
}

describe("Erste Begegnung mit der Bürgermeisterin", () => {
  it.each([
    [0, "Genau das müssen Sie herausfinden."],
    [1, "Das könnten wir. Dann verlieren wir."],
    [2, "Dann hätten wir weder eine Mehrheit noch ein Fest, das von der Stadt getragen wird."],
  ])("bildet Antwortpfad %i vollständig ab", (choice, expectedReply) => {
    const dialogue = reachMayorChoices();
    expect(dialogue.current.choices).toHaveLength(3);
    dialogue.choose(choice);
    expect(dialogue.current.text).toBe(expectedReply);
  });

  it("ergänzt bei Antwort C Rudis leeren Marktplatz", () => {
    const dialogue = reachMayorChoices();
    dialogue.choose(2);
    dialogue.advance();
    expect(dialogue.current.text).toBe("Ein leerer Marktplatz wäre jedenfalls keine gute Lösung.");
    dialogue.advance();
    expect(dialogue.current.text).toContain("Mia hilft am Kulturkai");
    dialogue.advance();
    expect(dialogue.current.text).toContain("sehr kurze Beine");
    expect(dialogue.advance()).toBe("complete");
  });
});
