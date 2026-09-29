import type { DialogueScript } from "../dialogue/types";
import type { ArgumentCardId } from "./argumentCards";
import type { GroupId, NegotiationFlags } from "./festivalRules";

export interface NegotiationOutcome {
  points: number;
  flag?: keyof NegotiationFlags;
  title: string;
  description: string;
}

interface NegotiationRoute {
  cardId: ArgumentCardId;
  label: string;
  proposal: string;
  concern: string;
  rudi: string;
  agreement: string;
}

const SPEAKER: Readonly<Record<GroupId, string>> = {
  "young-list": "Mia",
  "citizens-forum": "Herr Brömmel",
  "green-local": "Nora",
  "budget-hawks": "Herr Centner",
};

const INTRO: Readonly<Record<GroupId, string>> = {
  "young-list": "Mia hat den Bühnenplan mitgebracht. Ihr ist wichtig, dass junge Bands darin einen echten Platz bekommen.",
  "citizens-forum": "Herr Brömmel hat den Zeitplan markiert. Besonders der Heimweg nach dem letzten Auftritt beschäftigt ihn.",
  "green-local": "Nora hat Lieferwege, Pfandstationen und lokale Stände auf einer Karte eingezeichnet.",
  "budget-hawks": "Herr Centner legt die aktuelle Kalkulation auf den Tisch. Er möchte wissen, welche Kosten verbindlich sind.",
};

const RUDI_READ: Readonly<Record<GroupId, string>> = {
  "young-list": "Sie will ein Festival, das junge Leute ernst nimmt. Wir brauchen also einen echten Tausch – keinen Werbesatz.",
  "citizens-forum": "Er braucht einen verlässlichen Schluss und einen sicheren Heimweg. Darüber können wir konkret sprechen.",
  "green-local": "Nora will sehen, wie Pfand und lokale Stände im Alltag funktionieren. Eine Zusage allein reicht ihr nicht.",
  "budget-hawks": "Bei Centner zählt ein Vorschlag erst, wenn die Ersparnis belegbar ist. Bringen wir Zahlen mit.",
};

const ROUTES: Readonly<Record<GroupId, readonly NegotiationRoute[]>> = {
  "young-list": [
    {
      cardId: "resident-protection",
      label: "Große Bühne, aber verbindlich Schluss um 23 Uhr",
      proposal: "Die große Bühne bleibt. Dafür endet das Programm verbindlich um 23 Uhr – ohne heimliche Zugabe bis Mitternacht.",
      concern: "23 Uhr ist früh. Wenn die wichtigste Band erst kurz davor spielt, enttäuschen wir viele Leute.",
      rudi: "Dann geben wir ihr einen früheren, festen Slot. Das können wir im Programm verankern.",
      agreement: "Abgemacht. Große Bühne, sinnvoller Spielplan, Ende um 23 Uhr. Damit kann die Junge Liste leben.",
    },
    {
      cardId: "sustainability",
      label: "Newcomer-Bühne mit lokalen Acts bis 23 Uhr",
      proposal: "Eine Newcomer-Bühne für lokale Acts: günstiger als der große Aufbau, aber mit einem sichtbaren Platz im Programm.",
      concern: "Nur wenn die Technik verlässlich ist und die Bands nicht zwischen zwei Umbaupausen verschwinden.",
      rudi: "Wir legen Technik, Zeiten und Zuständigkeiten fest. Das ist mehr als ein Etikett.",
      agreement: "Mit echter Technik und einem festen Slot bis 23 Uhr gilt die Newcomer-Bühne für uns als vollwertiges Jugendprogramm.",
    },
  ],
  "citizens-forum": [
    {
      cardId: "youth-culture",
      label: "23 Uhr plus zusätzliches Sicherheitsteam",
      proposal: "Wir gehen auf 23 Uhr, stellen aber ein zusätzliches Team an den Wohnstraßen und informieren alle Häuser vorher.",
      concern: "Wer sorgt dafür, dass der Heimweg nicht durch die engen Wohnstraßen führt?",
      rudi: "Wir markieren die Route und setzen dort das zusätzliche Team ein.",
      agreement: "Mit Zusatzteam, ausgeschildertem Heimweg und Ende um 23 Uhr stimmt das Bürgerforum zu.",
    },
    {
      cardId: "sustainability",
      label: "23 Uhr mit Pfand, Sicherheit und leisem Abbau",
      proposal: "23 Uhr, Zusatzteam und Pfandbecher. Der Abbau beginnt erst am nächsten Morgen, damit nachts keine Container rollen.",
      concern: "Mir ist wichtig, dass nach 23 Uhr wirklich Ruhe einkehrt und die Vorgärten sauber bleiben.",
      rudi: "Das steht im Ablaufplan. Den Abbau legen wir auf den Morgen.",
      agreement: "Dann gilt: Pfand, Zusatzteam, leiser Abbau. Unter diesen Bedingungen akzeptieren wir 23 Uhr.",
    },
  ],
  "green-local": [
    {
      cardId: "budget-discipline",
      label: "Pfand und mindestens 50 Prozent lokale Stände",
      proposal: "Pfand bleibt gesetzt. Dafür garantieren wir mindestens 50 Prozent lokale Stände statt einer kaum erreichbaren 75-Prozent-Quote.",
      concern: "Fünfzig Prozent dürfen nicht bedeuten, dass ein lokaler Bäcker zwischen neun überregionalen Werbezelten steht.",
      rudi: "Wir zählen echte Standplätze und veröffentlichen die Vergabe. Dann ist die Quote überprüfbar.",
      agreement: "Gut. Pfand, mindestens die Hälfte echte lokale Betriebe und transparente Vergabe. Dann sind wir dabei.",
    },
    {
      cardId: "resident-protection",
      label: "Lokales Sammeldepot spart Liefer- und Pfandkosten",
      proposal: "Wir bündeln Lieferung, Pfandrückgabe und Müll am alten Depot. Weniger Fahrten, weniger Nachtlärm und niedrigere Logistikkosten.",
      concern: "Das Depot darf nach dem Fest nicht voller Becher und Kisten stehen bleiben.",
      rudi: "Abbau bis Montag und eine gemeinsame Kontrolle. Das nehmen wir in die Vereinbarung auf.",
      agreement: "Ein verbindlicher Depotplan spart Wege und 1.000 Euro. Bei Pfand und 75 Prozent lokalen Ständen tragen wir das mit.",
    },
  ],
  "budget-hawks": [
    {
      cardId: "youth-culture",
      label: "Helferteam für Bühne und Einlass",
      proposal: "Geschulte Vereinshelfer unterstützen Bühnenaufbau und Einlass. Profis bleiben verantwortlich, Routineaufgaben werden günstiger.",
      concern: "Freiwillige brauchen Anleitung und verlässliche Schichten. Sonst sparen wir nur auf dem Papier.",
      rudi: "Die Vereine bestätigen ihre Schichten schriftlich. Die Fachkräfte bleiben verantwortlich.",
      agreement: "Mit festen Schichten sinken Bühnen- und Sicherheitskosten. Das Helferteam wird im Haushalt berücksichtigt.",
    },
    {
      cardId: "sustainability",
      label: "Lokale Partner finanzieren Pfand und Stände",
      proposal: "Lokale Betriebe teilen Logistik und Pfandrückgabe. Dafür erhalten sie feste Standplätze statt teurer Fremddienstleister.",
      concern: "Eine Kooperation ist noch keine Zahl.",
      rudi: "Drei Betriebe haben zugesagt. Zusammen ergibt das 3.000 Euro weniger Stadtkosten.",
      agreement: "Nachgerechnet. Pfand plus mindestens 50 Prozent lokale Stände senken die Stadtkosten um 3.000 Euro.",
    },
  ],
};

export function getNegotiationOptions(groupId: GroupId): readonly ArgumentCardId[] {
  return ROUTES[groupId].map((route) => route.cardId);
}

export function createNegotiationDialogue(groupId: GroupId): DialogueScript {
  const speaker = SPEAKER[groupId];
  const routes = ROUTES[groupId];
  const nodes: DialogueScript["nodes"] = {
    intro: { id: "intro", speaker, text: INTRO[groupId], next: "rudi-read" },
    "rudi-read": { id: "rudi-read", speaker: "Rudi", text: RUDI_READ[groupId], next: "approach" },
    approach: {
      id: "approach",
      speaker: "Dein Vorschlag",
      text: "Welchen konkreten Kompromiss möchtest du anbieten? Beide verändern den Festivalplan tatsächlich.",
      choices: routes.map((route) => ({
        id: `card:${route.cardId}`,
        label: route.label,
        next: `proposal:${route.cardId}`,
      })),
    },
  };

  routes.forEach((route) => {
    const proposalId = `proposal:${route.cardId}`;
    const concernId = `concern:${route.cardId}`;
    const rudiId = `rudi:${route.cardId}`;
    const agreementId = `agreement:${route.cardId}`;
    nodes[proposalId] = { id: proposalId, speaker: "Du", text: route.proposal, next: concernId };
    nodes[concernId] = { id: concernId, speaker, text: route.concern, next: rudiId };
    nodes[rudiId] = { id: rudiId, speaker: "Rudi", text: route.rudi, next: agreementId };
    nodes[agreementId] = { id: agreementId, speaker, text: route.agreement };
  });

  return { id: `negotiation-${groupId}`, start: "intro", nodes };
}

export function resolveNegotiation(
  groupId: GroupId,
  cardId: ArgumentCardId,
  _subChoice?: string,
): NegotiationOutcome {
  if (groupId === "young-list" && cardId === "resident-protection") {
    return { points: 300, flag: "youngListAccepts23", title: "23-UHR-KOMPROMISS", description: "Große Bühne und ein verbindliches Ende um 23 Uhr bringen die Junge Liste an den Tisch." };
  }
  if (groupId === "young-list" && cardId === "sustainability") {
    return { points: 300, flag: "newcomerStageUnlocked", title: "NEWCOMER-BÜHNE", description: "Die lokale Newcomer-Bühne zählt als vollwertiges Jugendprogramm und macht 23 Uhr akzeptabel." };
  }
  if (groupId === "citizens-forum" && cardId === "youth-culture") {
    return { points: 300, flag: "citizensForumAccepts23", title: "23 UHR + SICHERHEIT", description: "Mit Zusatzteam und geplantem Heimweg akzeptiert das Bürgerforum 23 Uhr." };
  }
  if (groupId === "citizens-forum" && cardId === "sustainability") {
    return { points: 300, flag: "citizensForumAccepts23WithDeposit", title: "PFAND-KOMPROMISS", description: "Mit Pfand, Zusatzteam und leisem Abbau akzeptiert das Bürgerforum 23 Uhr." };
  }
  if (groupId === "green-local" && cardId === "budget-discipline") {
    return { points: 300, flag: "greenLocalAccepts50", title: "50-PROZENT-KOMPROMISS", description: "Pfand und mindestens 50 Prozent echte lokale Stände reichen Grün & Lokal künftig aus." };
  }
  if (groupId === "green-local" && cardId === "resident-protection") {
    return { points: 275, flag: "greenLogisticsDiscount", title: "LOKALES SAMMELDEPOT", description: "Gebündelte Lieferungen und Pfandrückgabe sparen bei einem konsequent lokalen Plan 1.000 Euro." };
  }
  if (groupId === "budget-hawks" && cardId === "youth-culture") {
    return { points: 275, flag: "helperTeamDiscount", title: "VERBINDLICHES HELFERTEAM", description: "Feste Vereinsschichten senken die Kosten für große Bühne und zusätzliches Sicherheitsteam." };
  }
  if (groupId === "budget-hawks" && cardId === "sustainability") {
    return { points: 300, flag: "localPartnerPackage", title: "LOKALES PARTNERPAKET", description: "Pfand plus mindestens 50 Prozent lokale Stände senken die Stadtkosten um 3.000 Euro." };
  }
  return { points: 0, title: "KEIN NEUER KOMPROMISS", description: "Dieses Argument verändert die Position der Gruppe nicht." };
}

export const negotiationsCompleteDialogue: DialogueScript = {
  id: "negotiations-complete",
  start: "agreements",
  nodes: {
    agreements: {
      id: "agreements",
      speaker: "Rudi",
      text: "Drei Gespräche, drei konkrete Vereinbarungen. Jetzt können wir den Plan darauf aufbauen.",
      next: "planning",
    },
    planning: {
      id: "planning",
      speaker: "Rudi",
      text: "Damit gibt es jetzt garantiert mindestens einen Plan mit sieben Stimmen. Am Planungspult zeigt der Mehrheitsblick sofort, welche Kombination funktioniert.",
    },
  },
};
