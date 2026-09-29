import type { DialogueScript } from "../../dialogue/types";
import type { FestivalPlan, GroupId } from "../festivalRules";

export const festivalOpeningDialogue: DialogueScript = {
  id: "festival-opening",
  start: "rudi-time",
  nodes: {
    "rudi-time": { id: "rudi-time", speaker: "Rudi", text: "Du hast noch zehn Minuten.", next: "player-why" },
    "player-why": { id: "player-why", speaker: "Du", text: "Wofür?", next: "rudi-fun" },
    "rudi-fun": { id: "rudi-fun", speaker: "Rudi", text: "Für völlig unproduktiven Spaß. Du hast ihn dir verdient. Und ich habe bereits eine Pommes im Blick." },
  },
};

export const festivalFinaleDialogue: DialogueScript = {
  id: "festival-finale",
  start: "rudi-city",
  nodes: {
    "rudi-city": { id: "rudi-city", speaker: "Rudi", text: "Okay. Das Festival steht. Die Stadt ist noch da.", next: "player-day" },
    "player-day": { id: "player-day", speaker: "Du", text: "Überraschend guter Tag.", next: "rudi-finale" },
    "rudi-finale": { id: "rudi-finale", speaker: "Rudi", text: "Bevor wir gehen, schauen wir uns an, wie wir hierhergekommen sind." },
  },
};

function oneLine(id: string, speaker: string, text: string): DialogueScript {
  return { id, start: "line", nodes: { line: { id: "line", speaker, text } } };
}

export function createFestivalGroupDialogue(
  groupId: GroupId,
  plan: FestivalPlan,
  supports: boolean,
  cost: number,
): DialogueScript {
  switch (groupId) {
    case "young-list":
      if (!supports) return oneLine("festival-mia-no", "Mia", "Ich freue mich, dass das Fest stattfindet. Beim nächsten Mal möchte ich aber früher mitreden, damit auch junge Bands Platz im Programm haben.");
      return oneLine(
        "festival-mia-yes",
        "Mia",
        plan.stage === "newcomer"
          ? "Die lokale Band füllt die Fläche. Gut, dass wir für sie einen eigenen Auftritt möglich gemacht haben."
          : "Die Bühne funktioniert. Vor allem sieht man, wie viele junge Leute schon lange auf so einen Abend gewartet haben.",
      );
    case "citizens-forum":
      return oneLine(
        "festival-broemmel",
        "Herr Brömmel",
        supports
          ? "Der Heimweg ist klar ausgeschildert, und vor den Wohnhäusern bleibt es ruhig. So kann ich das Fest wirklich genießen."
          : "Das Fest ist schön. Trotzdem müssen wir beim nächsten Mal früher über Lärm und den Abbau sprechen.",
      );
    case "green-local":
      return oneLine(
        "festival-nora",
        "Nora",
        plan.cups === "deposit"
          ? "Die Pfandstationen werden benutzt, und die Wege sind noch sauber. Das ist ein gutes Zeichen für morgen früh."
          : "Ich habe meinen Becher mitgebracht. Nächstes Jahr möchte ich ein Pfandsystem für alle Stände – das wäre weniger Arbeit nach dem Fest.",
      );
    case "budget-hawks":
      return oneLine(
        "festival-centner",
        "Herr Centner",
        cost <= 20_000
          ? `${cost.toLocaleString("de-DE")} Euro. Der Plan bleibt im vereinbarten Rahmen. Jetzt höre ich mir die Musik an.`
          : "Der Beschluss steht. Die Kosten sollten wir nach dem Fest offen auswerten, bevor wir fürs nächste Jahr planen.",
      );
  }
}

export const festivalMayorDialogue: DialogueScript = {
  id: "festival-mayor",
  start: "opening",
  nodes: {
    opening: {
      id: "opening", speaker: "Bürgermeisterin",
      text: "Sehen Sie sich um. Viele Menschen haben an diesem Fest mitgewirkt, und nicht alle wollten dasselbe. Was war für Sie die wichtigste Erkenntnis?",
      choices: [
        { id: "voices", label: "Wir müssen verschiedene Interessen ernst nehmen.", next: "voices" },
        { id: "budget", label: "Kosten und Nutzen gehören zusammen.", next: "budget" },
        { id: "compromise", label: "Kompromisse brauchen klare Zusagen.", next: "compromise" },
      ],
    },
    voices: {
      id: "voices", speaker: "Bürgermeisterin",
      text: "Mia brauchte einen Ort für junge Musik. Herr Brömmel musste an die Nachbarschaft denken. Beides hatte gute Gründe. Wie gehen wir nächstes Jahr damit um?",
      choices: [
        { id: "voices-early", label: "Alle Gruppen früher einbeziehen.", next: "voices-early" },
        { id: "voices-quiet", label: "Auch wenig Gehörte gezielt ansprechen.", next: "voices-quiet" },
        { id: "voices-check", label: "Entscheidungen nachvollziehbar erklären.", next: "voices-check" },
      ],
    },
    budget: {
      id: "budget", speaker: "Bürgermeisterin",
      text: "Das Budget war eine Grenze. Gleichzeitig hatte jede Ausgabe einen Zweck. Wie sollten wir solche Abwägungen künftig treffen?",
      choices: [
        { id: "budget-open", label: "Kosten und Annahmen offenlegen.", next: "budget-open" },
        { id: "budget-value", label: "Den Nutzen jeder Ausgabe prüfen.", next: "budget-value" },
        { id: "budget-help", label: "Ehrenamtliche Arbeit mit einplanen.", next: "budget-help" },
      ],
    },
    compromise: {
      id: "compromise", speaker: "Bürgermeisterin",
      text: "Ein Kompromiss hält nur, wenn die Beteiligten wissen, was vereinbart wurde. Was ist Ihnen dabei besonders wichtig?",
      choices: [
        { id: "compromise-clear", label: "Zusagen schriftlich festhalten.", next: "compromise-clear" },
        { id: "compromise-fair", label: "Lasten fair verteilen.", next: "compromise-fair" },
        { id: "compromise-review", label: "Ergebnisse später gemeinsam prüfen.", next: "compromise-review" },
      ],
    },
    "voices-early": { id: "voices-early", speaker: "Du", text: "Dann beginnen die Gespräche, bevor der Entwurf feststeht. So können die Hinweise den Plan wirklich verändern.", next: "closing" },
    "voices-quiet": { id: "voices-quiet", speaker: "Du", text: "Wir sollten nicht nur auf diejenigen warten, die von selbst zur Sitzung kommen.", next: "closing" },
    "voices-check": { id: "voices-check", speaker: "Du", text: "Auch abgelehnte Vorschläge brauchen eine Begründung. Sonst wirkt Beteiligung folgenlos.", next: "closing" },
    "budget-open": { id: "budget-open", speaker: "Du", text: "Wenn alle die Kosten kennen, können wir über Prioritäten sprechen statt über Vermutungen.", next: "closing" },
    "budget-value": { id: "budget-value", speaker: "Du", text: "Wir sollten zeigen, wem eine Ausgabe hilft und was wir dafür an anderer Stelle nicht tun können.", next: "closing" },
    "budget-help": { id: "budget-help", speaker: "Du", text: "Vereine können viel beitragen. Ihre Zeit und ihre Verantwortung müssen trotzdem im Plan stehen.", next: "closing" },
    "compromise-clear": { id: "compromise-clear", speaker: "Du", text: "Wir halten Zeiten, Zuständigkeiten und Kosten fest. Dann können sich alle darauf verlassen.", next: "closing" },
    "compromise-fair": { id: "compromise-fair", speaker: "Du", text: "Eine Einigung trägt nicht, wenn eine Gruppe allein alle Zugeständnisse machen muss.", next: "closing" },
    "compromise-review": { id: "compromise-review", speaker: "Du", text: "Nach dem Fest fragen wir alle Beteiligten, was funktioniert hat – auch diejenigen, die dagegen waren.", next: "closing" },
    closing: { id: "closing", speaker: "Bürgermeisterin", text: "Das nehmen wir in die Planung für nächstes Jahr mit. Eine Entscheidung ist heute gefallen; die Verantwortung dafür endet nicht mit dem Fest." },
  },
};

export const festivalAliDialogue = oneLine(
  "festival-ali",
  "Samira",
  "Heute gehen die Pommes schneller weg als erwartet. Ich hoffe, die Leute mögen auch die Musik – ich höre von hier nur den Bass.",
);
