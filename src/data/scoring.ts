export function councilPoints(votes: number, firstAttempt: boolean): number {
  if (!Number.isFinite(votes) || votes < 7) return 0;
  return (firstAttempt ? 1_500 : 750) + (Math.min(12, Math.floor(votes)) - 7) * 200;
}

export function completionBonuses(elapsedMs: number, cost: number): { time: number; budget: number } {
  return {
    // Up to 1,200 points; every second matters until 30 minutes.
    time: Number.isFinite(elapsedMs) && elapsedMs >= 0
      ? Math.max(0, Math.round(1_200 * (1 - elapsedMs / 1_800_000))) : 0,
    // One point per ten euros below the budget, capped at 500.
    budget: Number.isFinite(cost) && cost >= 0
      ? Math.min(500, Math.max(0, Math.floor((20_000 - cost) / 10))) : 0,
  };
}

export function speedPoints(maximum: number, responseMs: number, decayMs: number): number {
  if (!Number.isFinite(responseMs) || responseMs < 0 || decayMs <= 0) return 0;
  return Math.round(maximum * (0.25 + 0.75 * Math.max(0, 1 - responseMs / decayMs)));
}

export function roundPoints(points: number, completed: boolean, now: number, deadline: number): number {
  return completed && now < deadline ? Math.max(0, Math.round(points)) : 0;
}

export function canThrowPoints(x: number, responseMs: number): number {
  const accuracy = Math.max(0, 1 - Math.abs(x - 480) / 260);
  if (accuracy < 0.25) return 0;
  return speedPoints(Math.round(100 * accuracy ** 3), responseMs, 4_000);
}
