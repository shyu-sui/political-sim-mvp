// src/features/election/electionLogic.ts
export type ElectionPhase = 'idle' | 'announced' | 'voting' | 'counting' | 'result';

export type ElectionState = {
  phase: ElectionPhase;
  participating: boolean;   // 参加フラグ（いつでも出入り）
  month: number;
  year: number;
  lastResult?: { turnout: number; voteShare: number; won: boolean };
};

export type Inputs = {
  conservative: number;
  liberal: number;
  apathetic: number;
  credibility: number;
  comm: number;
  followers: number;
};

export const TUNING = {
  turnoutNoise: 5,          // ±5%
  electWinThreshold: 50,    // 得票率50%以上で当選
};

export function initialElectionState(): ElectionState {
  return { phase: 'idle', participating: false, month: 0, year: 0 };
}

export function announceElection(prev: ElectionState, month: number, year: number): ElectionState {
  return { ...prev, phase: 'announced', month, year };
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

export function computeResult(prev: ElectionState, inp: Inputs) {
  // 82 投票率 ≒ 100 - 無関心 + ノイズ
  const turnoutBase = 100 - inp.apathetic;
  const turnoutNoise = (Math.random() * 2 - 1) * TUNING.turnoutNoise;
  const turnout = clamp(turnoutBase + turnoutNoise, 0, 100);

  // 簡易「支持率近似」 → 得票率
  const approvalLike =
    (inp.conservative + inp.liberal) / 2 +
    (inp.credibility * 0.2) +
    (inp.comm * 0.1) +
    Math.min(10, inp.followers * 0.01) -
    (inp.apathetic * 0.2);

  const voteShare = clamp((approvalLike / 100) * (turnout / 100) * 100, 0, 100);
  const won = voteShare >= TUNING.electWinThreshold;

  const next: ElectionState = {
    ...prev,
    phase: 'result',
    lastResult: { turnout: Math.round(turnout), voteShare: Math.round(voteShare), won },
  };
  return next;
}

export function resetElection(prev: ElectionState): ElectionState {
  return { ...prev, phase: 'idle', participating: false, lastResult: undefined };
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}