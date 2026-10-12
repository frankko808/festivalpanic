import type { DialogueScript } from "../../dialogue/types";

export function createHaythanDialogue(alreadySpoken: boolean): DialogueScript {
  return {
    id: alreadySpoken ? "haythan-repeat" : "haythan-first",
    start: "start",
    nodes: {
      start: {
        id: "start",
        speaker: "Haythan",
        text: alreadySpoken
          ? "Hattest du auch eine 1? Nein? Dann rede nicht mit mir."
          : "Ich hatte eine 1 im Test, deshalb kann ich hier chillen.",
      },
    },
  };
}
