export interface DialoguePortrait {
  texture: string;
  background: number;
}

const PORTRAITS: Readonly<Record<string, DialoguePortrait>> = {
  Rudi: { texture: "rudi", background: 0x9fd9c3 },
  Bürgermeisterin: { texture: "mayor", background: 0xd4b7dc },
  Mia: { texture: "mia", background: 0xf3a8bd },
  "Junge Liste": { texture: "mia", background: 0xf3a8bd },
  "Herr Brömmel": { texture: "broemmel", background: 0xb9d5df },
  Bürgerforum: { texture: "broemmel", background: 0xb9d5df },
  Nora: { texture: "nora", background: 0xb8dfad },
  "Grün & Lokal": { texture: "nora", background: 0xb8dfad },
  "Herr Centner": { texture: "centner", background: 0xc9cfdb },
  Sparfüchse: { texture: "centner", background: 0xc9cfdb },
  Du: { texture: "player", background: 0xffdfa1 },
  "Oma Ortrud": { texture: "npc-purple", background: 0xd8c0ea },
  "Postbote Pepe": { texture: "npc-green", background: 0xb4dcbf },
  Samira: { texture: "npc-red", background: 0xf2b9b5 },
  "Frau Moos": { texture: "npc-gardener", background: 0xc9dfa7 },
  Mara: { texture: "npc-purple", background: 0xd8c0ea },
  "Jogger Juri": { texture: "npc-jogger", background: 0xf2b49f },
  "Kalle Kabel": { texture: "npc-technician", background: 0xafccdc },
  "Lina Lied": { texture: "npc-musician", background: 0xd5b8ed },
  "Timo am Empfang": { texture: "npc-clerk", background: 0xbcd8df },
  Wachmann: { texture: "npc-guard", background: 0xafbdd4 },
  "Bäckerin Bea": { texture: "npc-red", background: 0xf2c3a4 },
  "Flora Feld": { texture: "npc-green", background: 0xb8dfad },
  "Derya Demir": { texture: "npc-purple", background: 0xd8c0ea },
  "Niko Noll": { texture: "npc-clerk", background: 0xbcd8df },
  Ali: { texture: "npc-red", background: 0xf2c3a4 },
};

const ICONS: Readonly<Record<string, DialoguePortrait>> = {
  Mülleimer: { texture: "trash-bin", background: 0xaed4b5 },
  Suchplakat: { texture: "cat", background: 0xf3c998 },
  Wunschbrunnen: { texture: "quest-coin", background: 0xaedee4 },
  Fundstück: { texture: "quest-coin", background: 0xffdf83 },
  Ziel: { texture: "quest-receipt", background: 0xffe7a8 },
  "Dein Vorschlag": { texture: "quest-receipt", background: 0xffe7a8 },
  Festivalplan: { texture: "quest-receipt", background: 0xffe7a8 },
  Abstimmung: { texture: "mayor", background: 0xd4b7dc },
  WARNUNG: { texture: "quest-receipt", background: 0xf0a1a1 },
};

export function resolveDialoguePortrait(speaker: string): DialoguePortrait {
  const direct = PORTRAITS[speaker] ?? ICONS[speaker];
  if (direct) return direct;

  const prefix = Object.keys(PORTRAITS).find((name) => speaker.startsWith(name));
  if (prefix) return PORTRAITS[prefix]!;

  return { texture: "npc-clerk", background: 0xc7d2dc };
}
