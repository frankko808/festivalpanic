import { describe, expect, it } from "vitest";
import { miaFirstMeeting } from "../data/dialogues/miaFirstMeeting";
import { broemmelFirstMeeting } from "../data/dialogues/broemmelFirstMeeting";
import { noraFirstMeeting } from "../data/dialogues/noraFirstMeeting";
import { centnerFirstMeeting } from "../data/dialogues/centnerFirstMeeting";
import { centnerReceiptBriefing, noraCleanupBriefing } from "../data/dialogues/groupQuestDialogues";

describe("natürliche Gruppeneinstiege", () => {
  it("verankert jede Gruppe zuerst in einer konkreten Alltagssituation", () => {
    expect(miaFirstMeeting.nodes[miaFirstMeeting.start]?.text).toContain("Kabel");
    expect(broemmelFirstMeeting.nodes[broemmelFirstMeeting.start]?.text).toContain("Kronkorken");
    expect(noraFirstMeeting.nodes[noraFirstMeeting.start]?.text).toContain("Aufräumen");
    expect(centnerFirstMeeting.nodes[centnerFirstMeeting.start]?.text).toContain("Belege");
  });

  it("erklärt Noras Aufgabe über Folgen für den Park", () => {
    expect(Object.keys(noraCleanupBriefing.nodes)).toHaveLength(4);
    expect(Object.values(noraCleanupBriefing.nodes).map((node) => node.text).join(" ")).toContain("Ehrenamtliche");
  });

  it("macht Centners Belegsuche zu einem nachvollziehbaren Rathausproblem", () => {
    expect(Object.keys(centnerReceiptBriefing.nodes)).toHaveLength(4);
    const text = Object.values(centnerReceiptBriefing.nodes).map((node) => node.text).join(" ");
    expect(text).toContain("Marktplatz");
    expect(text).toContain("Buchhaltung");
  });
});
