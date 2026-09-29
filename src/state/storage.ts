import type { RunState } from "./GameState";

const STORAGE_KEY = "festival-panic-save-v1";
const RUN_STORAGE_KEY = "festival-panic-run-v1";

export type ResumeSceneKey = "TownScene" | "ParkScene" | "KaiScene" | "TownHallScene" | "CouncilChamberScene" | "ShopInteriorScene" | "FestivalScene";
export interface ResumePoint {
  scene: ResumeSceneKey;
  x: number;
  y: number;
  shopId?: "bakery" | "florist" | "cafe" | "bookshop";
  returnSpawn?: { x: number; y: number };
}
export interface RunSave {
  version: 1;
  savedAt: number;
  run: RunState;
  point: ResumePoint;
}

const RESUME_SCENES: ResumeSceneKey[] = ["TownScene", "ParkScene", "KaiScene", "TownHallScene", "CouncilChamberScene", "ShopInteriorScene", "FestivalScene"];

export interface PersistedSave {
  highScore: number;
  achievements: string[];
  completedRuns: number;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
    lastAppearance?: CharacterAppearance;
  };
}

export interface CharacterAppearance {
  skin: number;
  hair: number;
  hairColor: number;
  top: number;
  bottom: number;
  accessory: number;
}

const DEFAULT_SAVE: PersistedSave = {
  highScore: 0,
  achievements: [],
  completedRuns: 0,
  settings: {
    musicVolume: 0.8,
    sfxVolume: 0.8,
    muted: false,
  },
};

function canUseStorage(): boolean {
  try { return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
  catch { return false; }
}

export function loadSave(): PersistedSave {
  if (!canUseStorage()) {
    return structuredClone(DEFAULT_SAVE);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_SAVE);
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSave>;
    return {
      highScore: Number.isFinite(parsed.highScore) ? parsed.highScore! : 0,
      achievements: Array.isArray(parsed.achievements)
        ? parsed.achievements.filter((id): id is string => typeof id === "string" && id !== "akh-status")
        : [],
      completedRuns: Number.isFinite(parsed.completedRuns) ? parsed.completedRuns! : 0,
      settings: {
        ...DEFAULT_SAVE.settings,
        ...parsed.settings,
        muted: typeof parsed.settings?.muted === "boolean" ? parsed.settings.muted : false,
      },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function writeSave(save: PersistedSave): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // A blocked or full localStorage must never prevent a run from continuing.
  }
}

export function loadRunSave(): RunSave | undefined {
  if (!canUseStorage()) return undefined;
  try {
    const raw = window.localStorage.getItem(RUN_STORAGE_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<RunSave>;
    if (value.version !== 1 || !value.run || !value.point || !Number.isFinite(value.savedAt)) return undefined;
    const run = value.run;
    const point = value.point;
    if (run.debugMode || run.phase === "results" || run.phase === "title" ||
      !Number.isFinite(run.score) || !Number.isFinite(run.elapsedMs) ||
      !run.flags || !run.quest?.groupInterviews || !run.quest?.groupsNegotiated || !run.quest?.negotiationFlags ||
      !Array.isArray(run.quest.argumentCards) || !run.favors?.status || !Array.isArray(run.favors.trashCollected) ||
      !Array.isArray(run.favors.receiptsCollected) || !run.sideQuests || !Array.isArray(run.sideQuests.coinIds) ||
      !run.planning?.draft || !run.council || !run.festivalActivities ||
      !RESUME_SCENES.includes(point.scene) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return undefined;
    return value as RunSave;
  } catch {
    return undefined;
  }
}

export function writeRunSave(save: RunSave): void {
  if (!canUseStorage()) return;
  try { window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(save)); }
  catch { /* Storage errors must not interrupt play. */ }
}

export function clearRunSave(): void {
  if (!canUseStorage()) return;
  try { window.localStorage.removeItem(RUN_STORAGE_KEY); }
  catch { /* Storage errors must not interrupt play. */ }
}
