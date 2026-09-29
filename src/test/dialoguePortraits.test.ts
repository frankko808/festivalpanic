import { describe, expect, it } from "vitest";
import { resolveDialoguePortrait } from "../ui/dialoguePortraits";

describe("Dialogporträts", () => {
  it("ordnet Rudi und die vier politischen Gruppen ihren eigenen Figuren zu", () => {
    expect(resolveDialoguePortrait("Rudi").texture).toBe("rudi");
    expect(resolveDialoguePortrait("Mia").texture).toBe("mia");
    expect(resolveDialoguePortrait("Herr Brömmel").texture).toBe("broemmel");
    expect(resolveDialoguePortrait("Nora").texture).toBe("nora");
    expect(resolveDialoguePortrait("Herr Centner").texture).toBe("centner");
  });

  it("erkennt Gruppenüberschriften und die Bürgermeisterin", () => {
    expect(resolveDialoguePortrait("Junge Liste · 4 Stimmen").texture).toBe("mia");
    expect(resolveDialoguePortrait("Bürgerforum · 3 Stimmen").texture).toBe("broemmel");
    expect(resolveDialoguePortrait("Grün & Lokal · 3 Stimmen").texture).toBe("nora");
    expect(resolveDialoguePortrait("Sparfüchse · 2 Stimmen").texture).toBe("centner");
    expect(resolveDialoguePortrait("Bürgermeisterin").texture).toBe("mayor");
  });

  it("deckt Stadt-, Park-, Rathaus- und Geschäfts-NPCs ab", () => {
    const speakers = [
      "Oma Ortrud", "Postbote Pepe", "Samira", "Frau Moos", "Mara", "Jogger Juri",
      "Kalle Kabel", "Lina Lied", "Wachmann", "Bäckerin Bea", "Flora Feld", "Derya Demir",
    ];
    speakers.forEach((speaker) => expect(resolveDialoguePortrait(speaker).texture).not.toBe("npc-clerk"));
    expect(resolveDialoguePortrait("Timo am Empfang").texture).toBe("npc-clerk");
    expect(resolveDialoguePortrait("Niko Noll").texture).toBe("npc-clerk");
  });
});
