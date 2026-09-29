import type {
  DialogueAdvanceResult,
  DialogueNode,
  DialogueScript,
} from "./types";

export class DialogueController {
  private currentNodeId: string;
  private finished = false;

  constructor(private readonly script: DialogueScript) {
    this.currentNodeId = script.start;
    this.assertNodeExists(this.currentNodeId);
  }

  get current(): DialogueNode {
    return this.script.nodes[this.currentNodeId] as DialogueNode;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  advance(): DialogueAdvanceResult {
    if (this.finished) {
      return "complete";
    }
    if (this.current.choices?.length) {
      return "awaiting-choice";
    }
    if (!this.current.next) {
      this.finished = true;
      return "complete";
    }
    this.goTo(this.current.next);
    return "advanced";
  }

  choose(index: number): DialogueAdvanceResult {
    const choice = this.current.choices?.[index];
    if (!choice) {
      return "awaiting-choice";
    }
    this.goTo(choice.next);
    return "advanced";
  }

  private goTo(nodeId: string): void {
    this.assertNodeExists(nodeId);
    this.currentNodeId = nodeId;
  }

  private assertNodeExists(nodeId: string): void {
    if (!this.script.nodes[nodeId]) {
      throw new Error(`Dialogue node not found: ${nodeId}`);
    }
  }
}
