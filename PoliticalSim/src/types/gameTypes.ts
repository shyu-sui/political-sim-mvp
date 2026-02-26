// ====== 共通ゲーム型定義 ======

// --- 信念スコア ---
export type PolicyAxis = 'economy' | 'welfare' | 'security' | 'environment' | 'foreign';

/** 各政策軸ごとの立場スコア (0–100) + 一貫性スコア */
export type BeliefScore = {
  economy:     number; // 経済: 高=市場重視 / 低=規制重視
  welfare:     number; // 福祉: 高=大きな政府 / 低=自己責任
  security:    number; // 安全保障: 高=タカ派 / 低=ハト派
  environment: number; // 環境: 高=環境優先 / 低=経済優先
  foreign:     number; // 外交: 高=グローバル / 低=自国優先
  consistency: number; // 一貫性 (0–100): 矛盾発言で低下
};

export const defaultBeliefScore = (): BeliefScore => ({
  economy:     50,
  welfare:     50,
  security:    50,
  environment: 50,
  foreign:     50,
  consistency: 70,
});

// --- 架空政党 ---
export type Party = {
  id:           string;
  name:         string;
  shortName:    string;
  color:        string;       // CSS カラー
  ideology:     string;
  beliefs:      Omit<BeliefScore, 'consistency'>;
  orgStrength:  number;       // 組織力 0–100
  funding:      number;       // 資金力 0–100
  factions:     string[];     // 派閥名リスト
  description:  string;
};

// --- 討論バトル ---
export type DebateSkill =
  | 'logic_attack'      // ロジックアタック
  | 'data_shield'       // データシールド
  | 'emotional_appeal'  // 感情訴求
  | 'nitpick';          // 揚げ足取り

export type DebateLogEntry = {
  actor:   'player' | 'opponent';
  skill:   DebateSkill;
  message: string;
  damage:  number;
};

export type DebateState = {
  active:        boolean;
  opponentName:  string;
  opponentParty: string;
  topic:         string;
  playerHP:      number;
  opponentHP:    number;
  maxHP:         number;
  shielded:      boolean; // データシールド使用中
  turn:          'player' | 'opponent' | 'done';
  log:           DebateLogEntry[];
  result?:       'win' | 'lose';
};

export const defaultDebateState = (): DebateState => ({
  active:        false,
  opponentName:  '',
  opponentParty: '',
  topic:         '',
  playerHP:      100,
  opponentHP:    80,
  maxHP:         100,
  shielded:      false,
  turn:          'player',
  log:           [],
});

// --- スキャンダルイベント ---
export type ScandalType = 'secretary' | 'funds' | 'media_bias';

export type ScandalChoice = {
  id:       string;
  label:    string;
  desc:     string;
  outcome: {
    approvalDelta:     number;
    consistencyDelta:  number;
    credibilityDelta:  number;
    message:           string;
    success:           boolean;
  };
};

export type ScandalState = {
  active:          boolean;
  type:            ScandalType;
  title:           string;
  description:     string;
  choices:         ScandalChoice[];
  resolvedChoice?: ScandalChoice;
};

export const noScandal = (): ScandalState => ({
  active:      false,
  type:        'secretary',
  title:       '',
  description: '',
  choices:     [],
});

// --- 支持率 (計算用ヘルパ) ---
export function computeApprovalRate(params: {
  conservative:  number;
  liberal:       number;
  apathetic:     number;
  consistency:   number;
}): number {
  const base = (params.conservative + params.liberal) / 2;
  const bonus = params.consistency * 0.08;
  const penalty = params.apathetic * 0.15;
  return Math.max(0, Math.min(100, Math.round(base + bonus - penalty)));
}
