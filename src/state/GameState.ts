import { clearRunSave, loadRunSave, loadSave, writeRunSave, writeSave, type CharacterAppearance, type PersistedSave, type ResumePoint, type RunSave } from "./storage";
import type { ArgumentCardId } from "../data/argumentCards";
import {
  DEFAULT_FESTIVAL_PLAN,
  DEFAULT_NEGOTIATION_FLAGS,
  type FestivalPlan,
  type GroupId,
  type NegotiationFlags,
} from "../data/festivalRules";
import { resolveNegotiation, type NegotiationOutcome } from "../data/negotiations";
import { evaluatePlanAchievements, type AchievementId } from "../data/achievements";

export type GamePhase =
  | "title"
  | "character-select"
  | "town-intro"
  | "rudi-complete"
  | "main-quest"
  | "group-survey-complete"
  | "planning"
  | "negotiation"
  | "council"
  | "festival"
  | "results";

export interface RunState {
  debugMode: boolean;
  phase: GamePhase;
  score: number;
  elapsedMs: number;
  achievements: AchievementId[];
  appearance: CharacterAppearance;
  flags: {
    rudiFirstMeetingComplete: boolean;
    mayorArrived: boolean;
    mayorFirstMeetingComplete: boolean;
    groupSummaryComplete: boolean;
    majorityViewUnlocked: boolean;
    firstDraftSaved: boolean;
    turboUnlocked: boolean;
    festivalMayorConversationComplete: boolean;
  };
  quest: {
    mainQuestStarted: boolean;
    groupsInterviewed: number;
    groupsTotal: number;
    groupInterviews: Record<GroupId, boolean>;
    argumentCards: ArgumentCardId[];
    negotiationStarted: boolean;
    negotiationTokensRemaining: number;
    negotiationTokensTotal: number;
    groupsNegotiated: Record<GroupId, boolean>;
    negotiationFlags: NegotiationFlags;
  };
  favors: {
    status: Record<GroupId, "locked" | "active" | "ready" | "complete">;
    trashCollected: string[];
    receiptsCollected: string[];
  };
  sideQuests: {
    bakeryDelivery: "available" | "active" | "complete";
    missingCat: "available" | "active" | "complete";
    missingCatEncounters: number;
    missingCatSpotOrder: number[];
    fountainCoins: "available" | "active" | "ready" | "complete";
    coinIds: string[];
  };
  companion: {
    rudiConversationCount: number;
  };
  planning: {
    draft: FestivalPlan;
    savedPlan?: FestivalPlan;
    finalPlan?: FestivalPlan;
  };
  council: {
    attempts: number;
    outcome: "pending" | "passed" | "rescued";
    rescuePenalty: number;
  };
  festivalActivities: {
    friesRushScore: number;
    canTossScore: number;
    rudiFound: boolean;
    rudiSearchActive: boolean;
  };
}

const DEFAULT_APPEARANCE: CharacterAppearance = {
  skin: 1,
  hair: 0,
  hairColor: 0,
  top: 0,
  bottom: 0,
  accessory: 0,
};

class GameStateStore {
  private save: PersistedSave = loadSave();
  private run: RunState = this.createRun();
  private pendingResume: RunSave | undefined = loadRunSave();
  private resumePoint?: ResumePoint;
  private lastRunSaveAt = 0;

  private createRun(): RunState {
    return {
      debugMode: false,
      phase: "title",
      score: 0,
      elapsedMs: 0,
      achievements: [],
      appearance: {
        ...DEFAULT_APPEARANCE,
        ...this.save.settings.lastAppearance,
      },
      flags: {
        rudiFirstMeetingComplete: false,
        mayorArrived: false,
        mayorFirstMeetingComplete: false,
        groupSummaryComplete: false,
        majorityViewUnlocked: false,
        firstDraftSaved: false,
        turboUnlocked: false,
        festivalMayorConversationComplete: false,
      },
      quest: {
        mainQuestStarted: false,
        groupsInterviewed: 0,
        groupsTotal: 4,
        groupInterviews: {
          "young-list": false,
          "citizens-forum": false,
          "green-local": false,
          "budget-hawks": false,
        },
        argumentCards: [],
        negotiationStarted: false,
        negotiationTokensRemaining: 0,
        negotiationTokensTotal: 3,
        groupsNegotiated: {
          "young-list": false,
          "citizens-forum": false,
          "green-local": false,
          "budget-hawks": false,
        },
        negotiationFlags: { ...DEFAULT_NEGOTIATION_FLAGS },
      },
      favors: {
        status: {
          "young-list": "locked",
          "citizens-forum": "locked",
          "green-local": "locked",
          "budget-hawks": "locked",
        },
        trashCollected: [],
        receiptsCollected: [],
      },
      sideQuests: {
        bakeryDelivery: "available",
        missingCat: "available",
        missingCatEncounters: 0,
        missingCatSpotOrder: [],
        fountainCoins: "available",
        coinIds: [],
      },
      companion: {
        rudiConversationCount: 0,
      },
      planning: {
        draft: { ...DEFAULT_FESTIVAL_PLAN },
      },
      council: {
        attempts: 0,
        outcome: "pending",
        rescuePenalty: 0,
      },
      festivalActivities: {
        friesRushScore: 0,
        canTossScore: 0,
        rudiFound: false,
        rudiSearchActive: false,
      },
    };
  }

  get current(): Readonly<RunState> {
    return this.run;
  }

  get persisted(): Readonly<PersistedSave> {
    return this.save;
  }

  get hasResume(): boolean {
    return Boolean(this.pendingResume);
  }

  resetRun(preserveSaved = false): void {
    this.run = this.createRun();
    this.resumePoint = undefined;
    this.lastRunSaveAt = 0;
    if (!preserveSaved) {
      this.pendingResume = undefined;
      clearRunSave();
    }
  }

  resumeSavedRun(): ResumePoint | undefined {
    if (!this.pendingResume) return undefined;
    this.run = structuredClone(this.pendingResume.run);
    this.run.festivalActivities.rudiSearchActive = false;
    this.resumePoint = structuredClone(this.pendingResume.point);
    if (this.run.phase === "festival" || this.run.council.outcome !== "pending") {
      this.resumePoint = { scene: "FestivalScene", x: 800, y: 790 };
    }
    this.lastRunSaveAt = 0;
    return structuredClone(this.resumePoint);
  }

  captureResumePoint(point: ResumePoint): void {
    if (!this.run.debugMode && this.run.phase !== "results" && this.run.phase !== "title") {
      this.resumePoint = point;
    }
  }

  flushRunSave(): void {
    if (!this.resumePoint || this.run.debugMode || this.run.phase === "title" || this.run.phase === "character-select" || this.run.phase === "results") return;
    const snapshot: RunSave = { version: 1, savedAt: Date.now(), run: structuredClone(this.run), point: structuredClone(this.resumePoint) };
    writeRunSave(snapshot);
    this.pendingResume = snapshot;
    this.lastRunSaveAt = snapshot.savedAt;
  }

  setPhase(phase: GamePhase): void {
    this.run.phase = phase;
    if (phase === "results") {
      this.pendingResume = undefined;
      this.resumePoint = undefined;
      clearRunSave();
    }
  }

  advanceTime(deltaMs: number): void {
    if (this.run.phase === "title" || this.run.phase === "character-select" || this.run.phase === "results") return;
    if (Number.isFinite(deltaMs) && deltaMs > 0) this.run.elapsedMs += Math.min(deltaMs, 250);
    if (this.resumePoint && Date.now() - this.lastRunSaveAt >= 2_000) this.flushRunSave();
  }

  unlockAchievement(id: AchievementId): boolean {
    if (this.run.achievements.includes(id)) return false;
    this.run.achievements.push(id);
    if (!this.run.debugMode) {
      if (!this.save.achievements.includes(id)) this.save.achievements.push(id);
      writeSave(this.save);
    }
    return true;
  }

  private evaluateFinalPlanAchievements(): void {
    const plan = this.run.planning.finalPlan;
    if (!plan) return;
    evaluatePlanAchievements(plan, this.run.quest.negotiationFlags)
      .forEach((id) => this.unlockAchievement(id));
  }

  startRudiSearch(): void {
    if (!this.run.festivalActivities.rudiFound) this.run.festivalActivities.rudiSearchActive = true;
  }

  completeFestivalMayorConversation(): void {
    this.run.flags.festivalMayorConversationComplete = true;
  }

  setAppearance(appearance: CharacterAppearance): void {
    this.run.appearance = { ...appearance };
    this.save.settings.lastAppearance = { ...appearance };
    writeSave(this.save);
  }

  setAudioMuted(muted: boolean): void {
    this.save.settings.muted = muted;
    writeSave(this.save);
  }

  completeRudiMeeting(): void {
    this.run.flags.rudiFirstMeetingComplete = true;
    this.run.flags.mayorArrived = true;
    this.run.phase = "rudi-complete";
  }

  recordRudiConversation(): number {
    const conversationIndex = this.run.companion.rudiConversationCount;
    this.run.companion.rudiConversationCount += 1;
    return conversationIndex;
  }

  completeMayorMeeting(): void {
    this.run.flags.mayorFirstMeetingComplete = true;
    this.run.quest.mainQuestStarted = true;
    this.run.phase = "main-quest";
  }

  isGroupInterviewed(groupId: GroupId): boolean {
    return this.run.quest.groupInterviews[groupId];
  }

  getFavorStatus(groupId: GroupId): RunState["favors"]["status"][GroupId] {
    return this.run.favors.status[groupId];
  }

  startFavor(groupId: GroupId): boolean {
    if (this.run.favors.status[groupId] !== "locked") return false;
    this.run.favors.status[groupId] = "active";
    return true;
  }

  collectTrash(id: string): boolean {
    if (this.run.favors.status["green-local"] !== "active" || this.run.favors.trashCollected.includes(id)) return false;
    this.run.favors.trashCollected.push(id);
    if (this.run.favors.trashCollected.length >= 4) this.run.favors.status["green-local"] = "ready";
    return true;
  }

  depositTrash(): boolean {
    if (this.run.favors.status["green-local"] !== "ready") return false;
    this.run.favors.status["green-local"] = "complete";
    this.awardPoints(100);
    return true;
  }

  collectReceipt(id: string): boolean {
    if (this.run.favors.status["budget-hawks"] !== "active" || this.run.favors.receiptsCollected.includes(id)) return false;
    this.run.favors.receiptsCollected.push(id);
    if (this.run.favors.receiptsCollected.length >= 3) this.run.favors.status["budget-hawks"] = "ready";
    return true;
  }

  completeFavor(groupId: GroupId, points: number): boolean {
    if (this.run.favors.status[groupId] !== "ready") return false;
    this.run.favors.status[groupId] = "complete";
    this.awardPoints(points);
    return true;
  }

  startSideQuest(id: "bakeryDelivery" | "missingCat" | "fountainCoins"): boolean {
    if (this.run.sideQuests[id] !== "available") return false;
    this.run.sideQuests[id] = "active";
    if (id === "missingCat" && this.run.sideQuests.missingCatSpotOrder.length === 0) {
      const candidates = [0, 1, 2, 3, 4, 5, 6, 7];
      for (let index = candidates.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const current = candidates[index];
        const swap = candidates[swapIndex];
        if (current === undefined || swap === undefined) continue;
        candidates[index] = swap;
        candidates[swapIndex] = current;
      }
      this.run.sideQuests.missingCatSpotOrder = candidates.slice(0, 5);
    }
    return true;
  }

  completeSideQuest(id: "bakeryDelivery" | "missingCat", points: number): boolean {
    if (this.run.sideQuests[id] !== "active") return false;
    if (id === "missingCat" && this.run.sideQuests.missingCatEncounters < 3) return false;
    this.run.sideQuests[id] = "complete";
    if (id === "missingCat") this.run.flags.turboUnlocked = true;
    this.awardPoints(points);
    return true;
  }

  advanceMissingCatChase(): 1 | 2 | 3 | undefined {
    if (this.run.sideQuests.missingCat !== "active") return undefined;
    const encounter = Math.min(3, this.run.sideQuests.missingCatEncounters + 1) as 1 | 2 | 3;
    this.run.sideQuests.missingCatEncounters = encounter;
    if (encounter === 3) this.completeSideQuest("missingCat", 75);
    return encounter;
  }

  collectFountainCoin(id: string): boolean {
    if (this.run.sideQuests.fountainCoins !== "active" || this.run.sideQuests.coinIds.includes(id)) return false;
    this.run.sideQuests.coinIds.push(id);
    if (this.run.sideQuests.coinIds.length >= 3) this.run.sideQuests.fountainCoins = "ready";
    return true;
  }

  completeFountainCoins(): boolean {
    if (this.run.sideQuests.fountainCoins !== "ready") return false;
    this.run.sideQuests.fountainCoins = "complete";
    this.awardPoints(60);
    return true;
  }

  completeGroupInterview(groupId: GroupId, argumentCardId: ArgumentCardId): boolean {
    if (this.run.quest.groupInterviews[groupId]) {
      return false;
    }
    this.run.quest.groupInterviews[groupId] = true;
    this.run.quest.groupsInterviewed += 1;
    this.run.quest.argumentCards.push(argumentCardId);
    this.awardPoints(100);
    return true;
  }

  completeGroupSummary(choiceId: string | undefined): boolean {
    if (
      this.run.flags.groupSummaryComplete ||
      this.run.quest.groupsInterviewed !== this.run.quest.groupsTotal
    ) {
      return false;
    }
    if (choiceId === "seek-compromise" || choiceId === "seek-seven-votes") {
      this.awardPoints(100);
    }
    this.run.flags.groupSummaryComplete = true;
    this.run.flags.majorityViewUnlocked = true;
    this.run.phase = "group-survey-complete";
    return true;
  }

  updateFestivalDraft(plan: FestivalPlan): void {
    this.run.planning.draft = { ...plan };
  }

  saveFirstFestivalDraft(plan: FestivalPlan): boolean {
    if (this.run.flags.firstDraftSaved || !this.run.flags.majorityViewUnlocked) {
      return false;
    }
    this.run.planning.draft = { ...plan };
    this.run.planning.savedPlan = { ...plan };
    this.run.flags.firstDraftSaved = true;
    this.run.phase = "planning";
    return true;
  }

  startNegotiationQuest(): boolean {
    if (this.run.quest.negotiationStarted || !this.run.flags.firstDraftSaved) {
      return false;
    }
    this.run.quest.negotiationStarted = true;
    this.run.quest.negotiationTokensRemaining = this.run.quest.negotiationTokensTotal;
    this.run.phase = "negotiation";
    return true;
  }

  completeNegotiation(groupId: GroupId, outcome: NegotiationOutcome): boolean {
    if (
      !this.run.quest.negotiationStarted ||
      this.run.quest.negotiationTokensRemaining <= 0 ||
      this.run.quest.groupsNegotiated[groupId] ||
      !outcome.flag
    ) return false;
    this.run.quest.groupsNegotiated[groupId] = true;
    this.run.quest.negotiationTokensRemaining -= 1;
    this.run.quest.negotiationFlags[outcome.flag] = true;
    this.awardPoints(outcome.points);
    return true;
  }

  saveFinalFestivalPlan(plan: FestivalPlan): boolean {
    if (!this.run.quest.negotiationStarted || this.run.quest.negotiationTokensRemaining !== 0) return false;
    this.run.planning.draft = { ...plan };
    this.run.planning.finalPlan = { ...plan };
    this.run.phase = "council";
    return true;
  }

  recordCouncilVote(votes: number): "passed" | "amendment" | "rescued" {
    this.run.council.attempts += 1;
    if (votes >= 7) {
      this.run.council.outcome = "passed";
      this.awardPoints(this.run.council.attempts === 1 ? 1_500 : 750);
      if (votes === 12 && this.run.council.attempts === 1) this.awardPoints(500);
      this.run.phase = "festival";
      this.evaluateFinalPlanAchievements();
      return "passed";
    }
    if (this.run.council.attempts === 1) {
      this.run.phase = "planning";
      return "amendment";
    }
    this.run.quest.negotiationFlags.youngListAccepts23 = true;
    this.run.planning.finalPlan = {
      endTime: 23,
      stage: "large",
      security: "standard",
      cups: "deposit",
      localShare: 75,
    };
    this.run.planning.draft = { ...this.run.planning.finalPlan };
    this.run.score = Math.max(0, this.run.score - 1_000);
    this.run.council.rescuePenalty = 1_000;
    this.run.council.outcome = "rescued";
    this.run.phase = "festival";
    this.evaluateFinalPlanAchievements();
    return "rescued";
  }

  loadAfterNegotiationsCheckpoint(): void {
    this.resetRun(true);
    this.run.debugMode = true;

    this.completeRudiMeeting();
    this.completeMayorMeeting();

    this.startFavor("green-local");
    for (let index = 0; index < 4; index += 1) this.collectTrash(`trash-${index}`);
    this.depositTrash();
    this.startFavor("budget-hawks");
    for (let index = 0; index < 3; index += 1) this.collectReceipt(`receipt-${index}`);
    this.completeFavor("budget-hawks", 75);

    this.completeGroupInterview("young-list", "youth-culture");
    this.completeGroupInterview("citizens-forum", "resident-protection");
    this.completeGroupInterview("green-local", "sustainability");
    this.completeGroupInterview("budget-hawks", "budget-discipline");
    this.completeGroupSummary("seek-compromise");
    this.saveFirstFestivalDraft({
      endTime: 22,
      stage: "small",
      security: "extra-team",
      cups: "deposit",
      localShare: 75,
    });

    this.startNegotiationQuest();
    this.completeNegotiation("young-list", resolveNegotiation("young-list", "resident-protection"));
    this.completeNegotiation("citizens-forum", resolveNegotiation("citizens-forum", "youth-culture"));
    this.completeNegotiation("green-local", resolveNegotiation("green-local", "budget-discipline"));

    this.startSideQuest("missingCat");
    for (let encounter = 0; encounter < 3; encounter += 1) this.advanceMissingCatChase();
  }

  loadFestivalCheckpoint(stage: FestivalPlan["stage"] = "large"): void {
    this.run = this.createRun();
    this.run.debugMode = true;
    this.run.score = 7_200;
    this.run.flags = {
      rudiFirstMeetingComplete: true,
      mayorArrived: true,
      mayorFirstMeetingComplete: true,
      groupSummaryComplete: true,
      majorityViewUnlocked: true,
      firstDraftSaved: true,
      turboUnlocked: true,
      festivalMayorConversationComplete: false,
    };
    this.run.quest.mainQuestStarted = true;
    this.run.quest.groupsInterviewed = 4;
    this.run.quest.groupInterviews = {
      "young-list": true,
      "citizens-forum": true,
      "green-local": true,
      "budget-hawks": true,
    };
    this.run.quest.argumentCards = [
      "youth-culture",
      "resident-protection",
      "sustainability",
      "budget-discipline",
    ];
    this.run.quest.negotiationStarted = true;
    this.run.quest.negotiationTokensRemaining = 0;
    this.run.quest.groupsNegotiated = {
      "young-list": true,
      "citizens-forum": true,
      "green-local": true,
      "budget-hawks": false,
    };
    this.run.quest.negotiationFlags = {
      youngListAccepts23: true,
      newcomerStageUnlocked: true,
      citizensForumAccepts23: true,
      citizensForumAccepts23WithDeposit: true,
      greenLocalAccepts50: true,
      greenLogisticsDiscount: true,
      helperTeamDiscount: true,
      localPartnerPackage: true,
    };
    this.run.favors.status = {
      "young-list": "complete",
      "citizens-forum": "complete",
      "green-local": "complete",
      "budget-hawks": "complete",
    };
    this.run.sideQuests.bakeryDelivery = "complete";
    this.run.sideQuests.missingCat = "complete";
    this.run.sideQuests.missingCatEncounters = 3;
    this.run.sideQuests.missingCatSpotOrder = [0, 1, 2, 3, 4];
    this.run.sideQuests.fountainCoins = "complete";
    const plan: FestivalPlan = {
      endTime: 23,
      stage,
      security: "extra-team",
      cups: "deposit",
      localShare: 75,
    };
    this.run.planning.draft = { ...plan };
    this.run.planning.savedPlan = { ...plan };
    this.run.planning.finalPlan = { ...plan };
    this.run.council.attempts = 1;
    this.run.council.outcome = "passed";
    this.run.phase = "festival";
    this.evaluateFinalPlanAchievements();
  }

  recordFestivalActivity(kind: "fries" | "cans" | "find-rudi", points: number): number {
    const safePoints = Math.max(0, Math.round(points));
    if (kind === "find-rudi") {
      if (this.run.festivalActivities.rudiFound) return 0;
      this.run.festivalActivities.rudiFound = true;
      this.run.festivalActivities.rudiSearchActive = false;
      this.awardPoints(500);
      this.unlockAchievement("find-rudi");
      return 500;
    }
    const key = kind === "fries" ? "friesRushScore" : "canTossScore";
    const previous = this.run.festivalActivities[key];
    if (safePoints <= previous) return 0;
    const improvement = safePoints - previous;
    this.run.festivalActivities[key] = safePoints;
    this.awardPoints(improvement);
    return improvement;
  }

  awardPoints(points: number): void {
    if (!Number.isFinite(points) || points <= 0) return;
    this.run.score += Math.round(points);
    if (!this.run.debugMode && this.run.score > this.save.highScore) {
      this.save.highScore = this.run.score;
      writeSave(this.save);
    }
  }
}

export const gameState = new GameStateStore();
