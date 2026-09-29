import type { DialogueScript } from "../../dialogue/types";
import type { RunState } from "../../state/GameState";

export type RudiLocation = "market" | "park" | "kai" | "hall" | "shop";

interface Remark {
  text: string;
  followUp?: string;
}

const LOCATION_NAMES: Readonly<Record<RudiLocation, string>> = {
  market: "Marktplatz",
  park: "Stadtpark",
  kai: "Kulturkai",
  hall: "Rathaus",
  shop: "Laden",
};

const META_REMARKS: readonly Remark[] = [
  {
    text: "Die Zeit läuft. Ich rede gern mit dir, aber wir sollten das Festival nicht aus den Augen verlieren.",
    followUp: "Frag mich später ruhig noch einmal. Ich bleibe in deiner Nähe.",
  },
  {
    text: "Du weißt, dass ich dir folge, oder? Du musst nicht alle zwölf Sekunden prüfen, ob ich noch sprechen kann.",
    followUp: "Wenn ich kurz hinter einem Baum verschwinde, hole ich dich wieder ein.",
  },
  {
    text: "Noch ein Gespräch? Langsam wirkt es, als wolltest du wirklich jede meiner Antworten hören.",
    followUp: "Das ist nett. Ich spare mir den Rest für den Heimweg auf.",
  },
  {
    text: "Heute habe ich keinen neuen Hinweis. Nur Gesellschaft. Vielleicht reicht das gerade auch.",
    followUp: "Aber falls du einen Hinweis brauchst: Schau in deine Aufgabenliste.",
  },
  {
    text: "Ich glaube, du testest gerade, ob ich wirklich immer antworte. Bisher: ja.",
    followUp: "Das Festival braucht allerdings auch jemanden, der mit den anderen spricht.",
  },
  {
    text: "Ich kenne jetzt deinen Gesprächsrhythmus. Drei Schritte, umdrehen, Rudi fragen.",
    followUp: "Wir könnten die drei Schritte auch mal in Richtung Rathaus machen.",
  },
  {
    text: "Das ist schon unser Gespräch Nummer {count}. Gut, dass wir uns nicht jedes Mal neu vorstellen müssen.",
    followUp: "Ich bin weiterhin dabei. Auch wenn mir langsam die Themen ausgehen.",
  },
];

function practicalRemarks(state: Readonly<RunState>, location: RudiLocation): Remark[] {
  const place = LOCATION_NAMES[location];
  if (!state.flags.mayorFirstMeetingComplete) {
    return [
      {
        text: "Die Bürgermeisterin wartet schon. Sie wirkte besorgt, als ich sie zuletzt gesehen habe.",
        followUp: "Ich bleibe bei dir. Im Zweifel nicke ich fachkundig und sehe wichtig aus.",
      },
      {
        text: `Vom ${place} aus wirkt das Rathaus ganz ruhig. Drinnen sieht es wahrscheinlich anders aus.`,
        followUp: "Komm, wir hören uns erst einmal an, wie groß die Katastrophe offiziell ist.",
      },
      {
        text: "Kleiner Tipp: Erst zuhören, dann etwas versprechen. Sonst müssen wir später alles zurücknehmen.",
      },
    ];
  }

  if (state.quest.groupsInterviewed < state.quest.groupsTotal) {
    const remaining = state.quest.groupsTotal - state.quest.groupsInterviewed;
    return [
      {
        text: `Uns fehlen noch ${remaining} von ${state.quest.groupsTotal} Gruppen. Hören wir uns ihre Gründe an, bevor wir planen.`,
        followUp: "Die Leute wollen meistens erst verstanden werden, bevor sie über Lösungen sprechen.",
      },
      {
        text: `Am ${place} sieht alles erstaunlich normal aus. Dabei verhandeln wir gerade über die Zukunft eines ganzen Festivals.`,
        followUp: "Die Entscheidungen betreffen eben auch den Alltag an diesen Orten.",
      },
      {
        text: "Wenn jemand nicht sofort über das Festival reden will, steckt oft erst ein ganz alltägliches Problem dahinter.",
        followUp: "Wenn wir helfen, verstehen wir oft besser, worum es der Person geht.",
      },
    ];
  }

  if (!state.flags.firstDraftSaved) {
    return [
      {
        text: "Wir haben alle Positionen. Jetzt müssen wir daraus einen Plan bauen, der nicht schon beim Anschauen umfällt.",
        followUp: "Zurück zum Rathaus. Am Planungspult können wir die Forderungen vergleichen.",
      },
      {
        text: "Vier Gruppen, ein Fest. Wir werden nicht jeden Wunsch gleichzeitig erfüllen können.",
      },
      {
        text: "Unser erster Entwurf muss noch nicht perfekt sein. Er muss konkret genug sein, damit wir darüber sprechen können.",
      },
    ];
  }

  if (state.quest.negotiationStarted && state.quest.negotiationTokensRemaining > 0) {
    return [
      {
        text: `Noch ${state.quest.negotiationTokensRemaining} Gesprächsmarken. Wähle nur Angebote, die unseren Plan wirklich verbessern.`,
        followUp: "Ein freundliches Nicken ist nett. Eine belastbare Zusage gewinnt Abstimmungen.",
      },
      {
        text: "Wir müssen nicht alle glücklich machen. Aber genug Leute müssen mit dem Ergebnis leben können – idealerweise freiwillig.",
      },
      {
        text: `Am ${place} können wir kurz nachdenken. Danach sollten wir eine der offenen Gruppen ansprechen.`,
      },
    ];
  }

  if (state.phase === "council") {
    return [
      {
        text: "Der Plan steht. Jetzt zeigt sich, ob mindestens sieben Ratsmitglieder ihn mittragen.",
        followUp: "Wir wissen, warum wir diese Entscheidungen getroffen haben.",
      },
      { text: "Vor der Abstimmung noch einmal tief durchatmen. Ich übernehme den Teil mit dem optimistischen Schwanzwedeln." },
      { text: "Wir haben zugehört, geholfen und verhandelt. Mehr kann ein guter Plan nicht verlangen – außer sieben Stimmen." },
    ];
  }

  return [
    { text: "Ich bin dabei. Du entscheidest, wohin wir als Nächstes gehen." },
    { text: `Am ${place} riecht es heute nach Fortschritt. Oder nach Waffeln. Ich möchte beides nicht ausschließen.` },
    { text: "Falls du den Faden verlierst: Ein Blick ins Menü hilft. Falls du mich verlierst: Ich stehe vermutlich direkt hinter dir." },
  ];
}

export function createRudiCompanionDialogue(
  state: Readonly<RunState>,
  conversationIndex: number,
  location: RudiLocation,
): DialogueScript {
  const remark = conversationIndex < 3
    ? practicalRemarks(state, location)[conversationIndex]!
    : META_REMARKS[(conversationIndex - 3) % META_REMARKS.length]!;
  const text = remark.text.replace("{count}", String(conversationIndex + 1));
  const id = `rudi-companion-${conversationIndex}`;
  const nodes: DialogueScript["nodes"] = {
    rudi: {
      id: "rudi",
      speaker: "Rudi",
      text,
      ...(remark.followUp ? { next: "follow-up" } : {}),
    },
  };
  if (remark.followUp) {
    nodes["follow-up"] = {
      id: "follow-up",
      speaker: "Rudi",
      text: remark.followUp,
    };
  }
  return { id, start: "rudi", nodes };
}
