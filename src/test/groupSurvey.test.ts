import { describe, expect, it } from "vitest";
import { ARGUMENT_CARDS } from "../data/argumentCards";
import { broemmelFirstMeeting } from "../data/dialogues/broemmelFirstMeeting";
import { centnerFirstMeeting } from "../data/dialogues/centnerFirstMeeting";
import { groupSummary } from "../data/dialogues/groupSummary";
import { miaFirstMeeting } from "../data/dialogues/miaFirstMeeting";
import { noraFirstMeeting } from "../data/dialogues/noraFirstMeeting";
import type { DialogueScript } from "../dialogue/types";
import { gameState } from "../state/GameState";

function countTerminalPaths(script: DialogueScript): number {
  function visit(nodeId: string, path: readonly string[]): number {
    expect(path).not.toContain(nodeId);
    const node = script.nodes[nodeId];
    expect(node, `Fehlender Knoten ${nodeId} in ${script.id}`).toBeDefined();
    if (!node) {
      return 0;
    }
    const nextPath = [...path, nodeId];
    if (node.choices?.length) {
      return node.choices.reduce(
        (sum, choice) => sum + visit(choice.next, nextPath),
        0,
      );
    }
    return node.next ? visit(node.next, nextPath) : 1;
  }

  return visit(script.start, []);
}

describe("Gruppenbefragungen", () => {
  it("führt alle Mia-Pfade zu einem gültigen Ende", () => {
    expect(countTerminalPaths(miaFirstMeeting)).toBe(6);
    expect(miaFirstMeeting.nodes["young-list-demands"]?.text).toContain("24 Uhr");
  });

  it("führt alle Brömmel-Pfade zu einem gültigen Ende", () => {
    expect(countTerminalPaths(broemmelFirstMeeting)).toBe(9);
    expect(broemmelFirstMeeting.nodes["forum-demands"]?.text).toContain("Sicherheitsteam");
  });

  it("führt Noras sichtbare Umweltwahl durch alle Antwortpfade", () => {
    expect(countTerminalPaths(noraFirstMeeting)).toBe(9);
    expect(noraFirstMeeting.nodes["nora-opening"]?.choices).toHaveLength(3);
    expect(noraFirstMeeting.nodes["green-demands"]?.text).toContain("23 Uhr");
    expect(noraFirstMeeting.nodes["green-demands"]?.text).toContain("75 %");
  });

  it("führt alle Centner-Pfade zu einem gültigen Ende", () => {
    expect(countTerminalPaths(centnerFirstMeeting)).toBe(9);
    expect(centnerFirstMeeting.nodes["hawks-condition"]?.text).toContain("20.000 EUR");
  });

  it("bildet alle drei Antworten in Rudis Zusammenfassung ab", () => {
    expect(countTerminalPaths(groupSummary)).toBe(3);
  });
});

describe("Fortschritt der Gruppenbefragung", () => {
  it("vergibt jede Argumentkarte und ihre Punkte genau einmal", () => {
    gameState.resetRun();
    gameState.completeMayorMeeting();

    expect(gameState.completeGroupInterview("young-list", "youth-culture")).toBe(true);
    expect(gameState.completeGroupInterview("young-list", "youth-culture")).toBe(false);
    expect(gameState.current.quest.groupsInterviewed).toBe(1);
    expect(gameState.current.quest.argumentCards).toEqual(["youth-culture"]);
    expect(gameState.current.score).toBe(100);
  });

  it("schaltet nach vier Gruppen den Mehrheitsblick und den korrekten Bonus frei", () => {
    gameState.resetRun();
    gameState.completeMayorMeeting();
    gameState.completeGroupInterview("young-list", "youth-culture");
    gameState.completeGroupInterview("citizens-forum", "resident-protection");
    gameState.completeGroupInterview("green-local", "sustainability");
    gameState.completeGroupInterview("budget-hawks", "budget-discipline");

    expect(gameState.current.quest.argumentCards).toHaveLength(Object.keys(ARGUMENT_CARDS).length);
    expect(gameState.completeGroupSummary("seek-compromise")).toBe(true);
    expect(gameState.completeGroupSummary("seek-compromise")).toBe(false);
    expect(gameState.current.flags.majorityViewUnlocked).toBe(true);
    expect(gameState.current.phase).toBe("group-survey-complete");
    expect(gameState.current.score).toBe(500);
  });

  it("vergibt für Festival Resignation keinen Zusammenfassungsbonus", () => {
    gameState.resetRun();
    gameState.completeGroupInterview("young-list", "youth-culture");
    gameState.completeGroupInterview("citizens-forum", "resident-protection");
    gameState.completeGroupInterview("green-local", "sustainability");
    gameState.completeGroupInterview("budget-hawks", "budget-discipline");

    gameState.completeGroupSummary("cancel-festival");
    expect(gameState.current.score).toBe(400);
  });
});
