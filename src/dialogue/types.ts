export interface DialogueChoice {
  id: string;
  label: string;
  next: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  next?: string;
  choices?: DialogueChoice[];
}

export interface DialogueScript {
  id: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export type DialogueAdvanceResult = "advanced" | "awaiting-choice" | "complete";
