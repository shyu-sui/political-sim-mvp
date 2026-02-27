export const TUNING = {
  dayPerMonth: 30,            // 月の日数
  apPerDay: 3,                // 1日のAP
  rageRate: {                 // SNS炎上率
    easy: 0.10, normal: 0.15, hard: 0.20
  },
  snsInfluenceCoeff: 0.0005,  // followers × coeff → +1.0 に足す
  snsInfluenceCap: 2.5,       // 影響倍率の上限
  lifeEventProb: 0.10,        // 人生イベント確率（nextDay）
  newsDailyProb: 0.90,        // 日次ニュース確率
  // クリア/オーバー判定の閾値（市議選挑戦ライン：街頭演説・友達・SNS を数回で達成できるレベル）
  clear:       { credibility: 55, comm: 55, followers: 150, apathetic: 55 },
  gameOver:    { apathetic: 90, energy: 0 },
  // 選挙関連（必要に応じて）
  electWinThreshold: 50,
  turnoutNoise: 5,
} as const;