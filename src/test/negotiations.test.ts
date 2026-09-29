import { beforeEach, describe, expect, it } from "vitest";
import { createNegotiationDialogue, getNegotiationOptions, resolveNegotiation } from "../data/negotiations";
import { calculatePlanCost, calculateSupport, DEFAULT_NEGOTIATION_FLAGS, GROUPS, type FestivalPlan, type GroupId, type NegotiationFlags } from "../data/festivalRules";
import { gameState } from "../state/GameState";

const draft: FestivalPlan = { endTime: 22, stage: "small", security: "extra-team", cups: "deposit", localShare: 75 };

function unlockNegotiations(): void {
  gameState.resetRun();
  gameState.completeGroupInterview("young-list", "youth-culture");
  gameState.completeGroupInterview("citizens-forum", "resident-protection");
  gameState.completeGroupInterview("green-local", "sustainability");
  gameState.completeGroupInterview("budget-hawks", "budget-discipline");
  gameState.completeGroupSummary("seek-compromise");
  gameState.saveFirstFestivalDraft(draft);
  gameState.startNegotiationQuest();
}

describe("Verhandlungen", () => {
  beforeEach(unlockNegotiations);

  it("verbraucht genau drei Marken und jede Gruppe höchstens einmal", () => {
    const mia = resolveNegotiation("young-list", "resident-protection", "mia:23");
    expect(gameState.completeNegotiation("young-list", mia)).toBe(true);
    expect(gameState.completeNegotiation("young-list", mia)).toBe(false);
    expect(gameState.completeNegotiation("citizens-forum", resolveNegotiation("citizens-forum", "youth-culture"))).toBe(true);
    expect(gameState.completeNegotiation("green-local", resolveNegotiation("green-local", "budget-discipline"))).toBe(true);
    expect(gameState.completeNegotiation("budget-hawks", resolveNegotiation("budget-hawks", "sustainability"))).toBe(false);
    expect(gameState.current.quest.negotiationTokensRemaining).toBe(0);
  });

  it("schaltet Mias 23-Uhr-Kompromiss regelwirksam frei", () => {
    gameState.completeNegotiation("young-list", resolveNegotiation("young-list", "resident-protection", "mia:23"));
    const plan: FestivalPlan = { endTime: 23, stage: "large", security: "standard", cups: "deposit", localShare: 75 };
    expect(calculateSupport(plan, DEFAULT_NEGOTIATION_FLAGS).votes).toBe(3);
    expect(calculateSupport(plan, gameState.current.quest.negotiationFlags).votes).toBe(7);
  });

  it("wendet Centners Partnerpaket auf die Kosten an", () => {
    gameState.completeNegotiation("budget-hawks", resolveNegotiation("budget-hawks", "sustainability"));
    const plan: FestivalPlan = { endTime: 22, stage: "small", security: "extra-team", cups: "deposit", localShare: 50 };
    expect(calculatePlanCost(plan, gameState.current.quest.negotiationFlags)).toBe(calculatePlanCost(plan) - 3_000);
  });

  it("macht die Newcomer-Bühne zu einem echten 23-Uhr-Kompromiss", () => {
    const outcome = resolveNegotiation("young-list", "sustainability");
    gameState.completeNegotiation("young-list", outcome);
    const plan: FestivalPlan = { endTime: 23, stage: "newcomer", security: "standard", cups: "single-use", localShare: 0 };
    expect(calculateSupport(plan, gameState.current.quest.negotiationFlags).supporters).toContain("young-list");
  });

  it("senkt das Helferteam sowohl Bühnen- als auch Sicherheitskosten", () => {
    gameState.completeNegotiation("budget-hawks", resolveNegotiation("budget-hawks", "youth-culture"));
    const plan: FestivalPlan = { endTime: 22, stage: "large", security: "extra-team", cups: "single-use", localShare: 0 };
    expect(calculatePlanCost(plan, gameState.current.quest.negotiationFlags)).toBe(calculatePlanCost(plan) - 2_000);
  });

  it("macht Noras Sammeldepot einen konsequent lokalen Plan günstiger", () => {
    gameState.completeNegotiation("green-local", resolveNegotiation("green-local", "resident-protection"));
    const plan: FestivalPlan = { endTime: 22, stage: "small", security: "extra-team", cups: "deposit", localShare: 75 };
    expect(calculatePlanCost(plan, gameState.current.quest.negotiationFlags)).toBe(20_000);
    expect(calculateSupport(plan, gameState.current.quest.negotiationFlags).hasMajority).toBe(true);
  });

  it.each([
    ["young-list", "resident-protection", "mia:23", 300, "youngListAccepts23"],
    ["young-list", "sustainability", undefined, 300, "newcomerStageUnlocked"],
    ["citizens-forum", "youth-culture", undefined, 300, "citizensForumAccepts23"],
    ["citizens-forum", "sustainability", undefined, 300, "citizensForumAccepts23WithDeposit"],
    ["green-local", "resident-protection", undefined, 275, "greenLogisticsDiscount"],
    ["green-local", "budget-discipline", undefined, 300, "greenLocalAccepts50"],
    ["budget-hawks", "youth-culture", undefined, 275, "helperTeamDiscount"],
    ["budget-hawks", "sustainability", undefined, 300, "localPartnerPackage"],
  ] as const)("wertet %s + %s korrekt aus", (group, card, subChoice, points, flag) => {
    const outcome = resolveNegotiation(group, card, subChoice);
    expect(outcome.points).toBe(points);
    expect(outcome.flag).toBe(flag);
  });

  it("zeigt ausschließlich regelwirksame Kompromisse und führt sie als längere Gespräche", () => {
    GROUPS.forEach(({ id }) => {
      const script = createNegotiationDialogue(id);
      const choices = script.nodes.approach?.choices ?? [];
      expect(choices).toHaveLength(2);
      expect(choices.map((choice) => choice.id)).toEqual(
        getNegotiationOptions(id).map((cardId) => `card:${cardId}`),
      );
      choices.forEach((choice) => {
        const outcome = resolveNegotiation(id, choice.id.slice(5) as Parameters<typeof resolveNegotiation>[1]);
        expect(outcome.flag).toBeDefined();
        expect(outcome.points).toBeGreaterThan(0);
        const proposal = script.nodes[choice.next ?? ""];
        const concern = proposal?.next ? script.nodes[proposal.next] : undefined;
        const rudi = concern?.next ? script.nodes[concern.next] : undefined;
        const agreement = rudi?.next ? script.nodes[rudi.next] : undefined;
        expect([proposal, concern, rudi, agreement].every(Boolean)).toBe(true);
      });
    });
  });

  it("verbraucht für wirkungslose, nicht angebotene Argumente keine Gesprächsmarke", () => {
    const invalid = resolveNegotiation("young-list", "budget-discipline");
    expect(invalid.flag).toBeUndefined();
    expect(gameState.completeNegotiation("young-list", invalid)).toBe(false);
    expect(gameState.current.quest.negotiationTokensRemaining).toBe(3);
  });

  it("garantiert nach jeder Auswahl von drei Gruppen mindestens einen mehrheitsfähigen Plan", () => {
    const groupIds = GROUPS.map(({ id }) => id);
    const triples: GroupId[][] = [];
    for (let a = 0; a < groupIds.length; a += 1) {
      for (let b = a + 1; b < groupIds.length; b += 1) {
        for (let c = b + 1; c < groupIds.length; c += 1) {
          triples.push([groupIds[a]!, groupIds[b]!, groupIds[c]!]);
        }
      }
    }

    const plansFor = (flags: NegotiationFlags): FestivalPlan[] => {
      const plans: FestivalPlan[] = [];
      const stages = flags.newcomerStageUnlocked
        ? (["small", "large", "newcomer"] as const)
        : (["small", "large"] as const);
      for (const endTime of [22, 23, 24] as const) {
        for (const stage of stages) {
          for (const security of ["standard", "extra-team"] as const) {
            for (const cups of ["single-use", "deposit"] as const) {
              for (const localShare of [0, 50, 75] as const) {
                plans.push({ endTime, stage, security, cups, localShare });
              }
            }
          }
        }
      }
      return plans;
    };

    triples.forEach((triple) => {
      const optionSets = triple.map((groupId) => getNegotiationOptions(groupId));
      optionSets[0]!.forEach((first) => optionSets[1]!.forEach((second) => optionSets[2]!.forEach((third) => {
        const flags = { ...DEFAULT_NEGOTIATION_FLAGS };
        [first, second, third].forEach((cardId, index) => {
          const outcome = resolveNegotiation(triple[index]!, cardId);
          expect(outcome.flag).toBeDefined();
          if (outcome.flag) flags[outcome.flag] = true;
        });
        expect(plansFor(flags).some((plan) => calculateSupport(plan, flags).hasMajority)).toBe(true);
      })));
    });
  });
});

describe("Abstimmungsausgänge", () => {
  it("vergibt bei einer direkten Mehrheit den Beschlussbonus", () => {
    gameState.resetRun();
    const before = gameState.current.score;
    expect(gameState.recordCouncilVote(8)).toBe("passed");
    expect(gameState.current.score - before).toBe(1_500);
    expect(gameState.current.phase).toBe("festival");
  });

  it("erlaubt nach der ersten Niederlage einen Antrag und nutzt danach den Rettungsring", () => {
    gameState.resetRun();
    expect(gameState.recordCouncilVote(6)).toBe("amendment");
    expect(gameState.current.council.attempts).toBe(1);
    expect(gameState.recordCouncilVote(6)).toBe("rescued");
    expect(gameState.current.council.rescuePenalty).toBe(1_000);
    expect(gameState.current.planning.finalPlan).toBeDefined();
    expect(gameState.current.phase).toBe("festival");
  });
});
