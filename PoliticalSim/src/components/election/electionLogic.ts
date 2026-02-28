// src/features/election/electionLogic.ts
export type ElectionPhase = 'idle' | 'announced' | 'voting' | 'counting' | 'result';

/** 告示日から選挙当日までの日数 */
export const ELECTION_CAMPAIGN_DAYS = 10;

export type ElectionState = {
  phase: ElectionPhase;
  participating: boolean;   // 参加フラグ
  month: number;
  year: number;
  daysLeft: number;         // 選挙当日まで残り日数（0 = 選挙当日）
  lastResult?: { turnout: number; voteShare: number; rivalShare: number; won: boolean };
};

/** 告示日から選挙当日までのフェーズ */
export type ElectionCampaignPhase = 'pre' | 'early_voting' | 'election_day';

export type Inputs = {
  conservative: number;
  liberal: number;
  apathetic: number;
  credibility: number;
  comm: number;
  followers: number;
  consistency: number;  // 一貫性が低いと得票率にペナルティ
};

export const TUNING = {
  turnoutNoise: 5,          // ±5%
  electWinThreshold: 50,    // 得票率50%以上で当選
};

export function initialElectionState(): ElectionState {
  return { phase: 'idle', participating: false, month: 0, year: 0, daysLeft: 0 };
}

export function announceElection(prev: ElectionState, month: number, year: number): ElectionState {
  return { ...prev, phase: 'announced', month, year, daysLeft: ELECTION_CAMPAIGN_DAYS };
}

export function joinElection(prev: ElectionState): ElectionState {
  return { ...prev, participating: true };
}

export function leaveElection(prev: ElectionState): ElectionState {
  return { ...prev, participating: false };
}

export function openVoting(prev: ElectionState): ElectionState {
  return { ...prev, phase: 'voting' };
}

/** nextDay 時に呼ぶ。0 以下にはならない */
export function decrementDaysLeft(prev: ElectionState): ElectionState {
  return { ...prev, daysLeft: Math.max(0, prev.daysLeft - 1) };
}

/** daysLeft から現在の選挙キャンペーンフェーズを返す */
export function getCampaignPhase(daysLeft: number): ElectionCampaignPhase {
  if (daysLeft > 5)  return 'pre';
  if (daysLeft >= 1) return 'early_voting';
  return 'election_day';
}

export function computeResult(prev: ElectionState, inp: Inputs, winThreshold = TUNING.electWinThreshold) {
  // 投票率 ≒ 100 - 無関心 + ノイズ
  const turnoutBase = 100 - inp.apathetic;
  const turnoutNoise = (Math.random() * 2 - 1) * TUNING.turnoutNoise;
  const turnout = clamp(turnoutBase + turnoutNoise, 0, 100);

  // 支持率近似 → 得票率（ベース）
  const approvalLike =
    (inp.conservative + inp.liberal) / 2 +
    (inp.credibility * 0.2) +
    (inp.comm * 0.1) +
    Math.min(10, inp.followers * 0.01) -
    (inp.apathetic * 0.2);

  const baseShare = clamp((approvalLike / 100) * (turnout / 100) * 100, 0, 100);

  // 一貫性ペナルティ: consistency < 70 のとき得票率を減算
  const consistencyPenalty = inp.consistency < 70
    ? (70 - inp.consistency) * 0.4   // 最大 70*0.4=28 pt ダウン
    : 0;
  const voteShare = clamp(baseShare - consistencyPenalty, 0, 100);
  const rivalShare = clamp(100 - voteShare, 0, 100);
  const won = voteShare >= winThreshold;

  const next: ElectionState = {
    ...prev,
    phase: 'result',
    lastResult: {
      turnout:    Math.round(turnout),
      voteShare:  Math.round(voteShare),
      rivalShare: Math.round(rivalShare),
      won,
    },
  };
  return next;
}

export function resetElection(prev: ElectionState): ElectionState {
  return { ...prev, phase: 'idle', participating: false, lastResult: undefined };
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
