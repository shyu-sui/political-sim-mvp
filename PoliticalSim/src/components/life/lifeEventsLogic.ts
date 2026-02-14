// 人生イベント：仕様（進学/就職/結婚/出産/転居）
// Timeline 側の型に依存しないよう最低限の型だけエクスポート
export type Impact = 'good' | 'bad' | 'neutral';

export type PlayerStatus = { comm: number; credibility: number; energy: number; };
export type PublicOpinion = { conservative: number; liberal: number; apathetic: number; };

// 画面に出すための差分（バッジ用）
export type LifeDelta = { cons?: number; lib?: number; apa?: number };

export type LifeEventApplyResult = {
  status: Partial<PlayerStatus>;
  opinion: Partial<PublicOpinion>;
  impact: Impact;
  delta?: LifeDelta;
  title: string;
  desc: string;
};

export type LifeEventSpec = {
  key: 'school' | 'job' | 'marriage' | 'baby' | 'move';
  title: string;
  desc: string;
  apply: (s: PlayerStatus, o: PublicOpinion) => LifeEventApplyResult;
};

export const LIFE_EVENTS: LifeEventSpec[] = [
  {
    key: 'school',
    title: '進学した',
    desc: '新しい学びで視野が広がった。',
    apply: (s, o) => ({
      status: { comm: Math.min(100, s.comm + 3), energy: Math.max(0, s.energy - 2) },
      opinion:{ liberal: Math.min(100, o.liberal + 2), apathetic: Math.max(0, o.apathetic - 1) },
      impact: 'good',
      delta: { lib: +2, apa: -1 },
      title: '進学した',
      desc: '新しい学びで視野が広がった。',
    }),
  },
  {
    key: 'job',
    title: '就職した',
    desc: '社会人として新たな責任が生まれた。',
    apply: (s, o) => ({
      status: { credibility: Math.min(100, s.credibility + 3), energy: Math.max(0, s.energy - 3) },
      opinion:{ conservative: Math.min(100, o.conservative + 2), apathetic: Math.max(0, o.apathetic - 1) },
      impact: 'good',
      delta: { cons: +2, apa: -1 },
      title: '就職した',
      desc: '社会人として新たな責任が生まれた。',
    }),
  },
  {
    key: 'marriage',
    title: '結婚した',
    desc: '家族とともに歩み始めた。',
    apply: (s, o) => ({
      status: { credibility: Math.min(100, s.credibility + 2), comm: Math.min(100, s.comm + 1) },
      opinion:{ conservative: Math.min(100, o.conservative + 1) },
      impact: 'neutral',
      delta: { cons: +1 },
      title: '結婚した',
      desc: '家族とともに歩み始めた。',
    }),
  },
  {
    key: 'baby',
    title: '子どもが生まれた',
    desc: '生活が一層賑やかになった。',
    apply: (s, o) => ({
      status: { energy: Math.max(0, s.energy - 4), credibility: Math.min(100, s.credibility + 2) },
      opinion:{ conservative: Math.min(100, o.conservative + 1), apathetic: Math.max(0, o.apathetic - 1) },
      impact: 'good',
      delta: { cons: +1, apa: -1 },
      title: '子どもが生まれた',
      desc: '生活が一層賑やかになった。',
    }),
  },
  {
    key: 'move',
    title: '転居した',
    desc: '新しい地域コミュニティに参加。',
    apply: (s, o) => ({
      status: { comm: Math.min(100, s.comm + 2), energy: Math.max(0, s.energy - 1) },
      opinion:{ liberal: Math.min(100, o.liberal + 1) },
      impact: 'neutral',
      delta: { lib: +1 },
      title: '転居した',
      desc: '新しい地域コミュニティに参加。',
    }),
  },
];

// 乱数で1件選び、適用結果を返すユーティリティ
export function rollLifeEvent(
  status: PlayerStatus,
  opinion: PublicOpinion,
): LifeEventApplyResult {
  const spec = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
  return spec.apply(status, opinion);
}