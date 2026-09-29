import type { DialogueScript } from "../../dialogue/types";

export const noraCleanupBriefing: DialogueScript = {
  id: "nora-cleanup-briefing",
  start: "greeting",
  nodes: {
    greeting: { id: "greeting", speaker: "Nora", text: "Du suchst Grün & Lokal? Dann hast du uns gefunden. Zumindest den Teil von uns, der gerade hinter einem Busch eine Chipstüte hervorzieht.", next: "reason" },
    reason: { id: "reason", speaker: "Nora", text: "Der Park gehört nach einem Fest weiterhin allen. Letztes Jahr mussten zwei Ehrenamtliche einen ganzen Sonntag lang hinter Einwegbechern herlaufen.", next: "request" },
    request: { id: "request", speaker: "Nora", text: "Hilfst du mir mit den vier Müllteilen hier im Park? Wirf sie anschließend in den grünen Mülleimer. Dann können wir in Ruhe über das Festival reden.", next: "rudi" },
    rudi: { id: "rudi", speaker: "Rudi", text: "Ich helfe mit. Bei den Bechern komme ich mit meinen Pfoten sogar gut an den Boden." },
  },
};

export function noraCleanupProgress(found: number): DialogueScript {
  return {
    id: `nora-cleanup-progress-${found}`,
    start: "progress",
    nodes: {
      progress: { id: "progress", speaker: "Nora", text: found < 4 ? `Danke fürs Mithelfen. Du hast ${found} von 4 Müllteilen gefunden. Schau auch abseits des Weges.` : "Alles gefunden. Jetzt noch in den grünen Mülleimer, dann ist der Park wieder sauber." },
    },
  };
}

export const centnerReceiptBriefing: DialogueScript = {
  id: "centner-receipt-briefing",
  start: "paperwork",
  nodes: {
    paperwork: { id: "paperwork", speaker: "Herr Centner", text: "Einen Moment. Mir fehlen drei Belege aus der vorläufigen Marktkalkulation.", next: "wind" },
    wind: { id: "wind", speaker: "Herr Centner", text: "Timo hat das Fenster geöffnet, weil im Rathaus angeblich Luft fehlte. Jetzt fehlt mir stattdessen die Buchhaltung.", next: "request" },
    request: { id: "request", speaker: "Herr Centner", text: "Die Zettel müssten auf dem Marktplatz liegen. Bringen Sie mir alle drei, dann können wir über belastbare Zahlen und Ihre Festivalidee sprechen.", next: "rudi" },
    rudi: { id: "rudi", speaker: "Rudi", text: "Ich sehe mich am Brunnen um. Der Wind hat die Zettel weit getragen." },
  },
};

export function centnerReceiptProgress(found: number): DialogueScript {
  return {
    id: `centner-receipt-progress-${found}`,
    start: "progress",
    nodes: {
      progress: { id: "progress", speaker: "Herr Centner", text: `Sie haben ${found} von 3 Belegen. Vielen Dank. Der Rest müsste noch auf dem Marktplatz liegen.` },
    },
  };
}

export const centnerReceiptComplete: DialogueScript = {
  id: "centner-receipt-complete",
  start: "complete",
  nodes: {
    complete: { id: "complete", speaker: "Herr Centner", text: "Alle drei. Gut, die Summe stimmt wieder. Danke für Ihre Hilfe. Jetzt sprechen wir über den Festivalplan.", next: "rudi" },
    rudi: { id: "rudi", speaker: "Rudi", text: "Die Belege sind zurück. Jetzt haben wir endlich eine gemeinsame Grundlage." },
  },
};
