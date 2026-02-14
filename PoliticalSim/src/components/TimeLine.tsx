
import React, { useMemo, useState } from 'react';
import './timeline.css';
import { FiZap, FiUsers, FiTwitter, FiGlobe, FiBell } from 'react-icons/fi';

export type EventCategory = 'news' | 'sns' | 'friend' | 'action' | 'system';
export type Impact = 'good' | 'bad' | 'neutral';
export type TimelineEvent = {
  id: string;
  date: string;
  category: EventCategory;
  title: string;
  description?: string;
  impact: Impact;
  delta?: { cons?: number; lib?: number; apa?: number; followers?: number };
};

// --- 友達（NPC）関連 ---
// 友達の政治傾向（0-100）
type Friend = {
  id: string;
  name: string;
  conservative: number;
  liberal: number;
  apathetic: number;
};

function randRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeInitialFriends(): Friend[] {
  return [
    {
      id: crypto.randomUUID(),
      name: '友人A',
      conservative: randRange(30, 70),
      liberal: randRange(30, 70),
      apathetic: randRange(20, 60),
    },
    {
      id: crypto.randomUUID(),
      name: '友人B',
      conservative: randRange(30, 70),
      liberal: randRange(30, 70),
      apathetic: randRange(20, 60),
    },
    {
      id: crypto.randomUUID(),
      name: '友人C',
      conservative: randRange(30, 70),
      liberal: randRange(30, 70),
      apathetic: randRange(20, 60),
    },
  ];
}

// 54: プレイヤーステータスの型
type PlayerStatus = {
  comm: number;       // コミュ力
  credibility: number; // 信頼
  energy: number;     // 体力
};

// 58: 世論パラメータ
type PublicOpinion = {
  conservative: number; // 保守
  liberal: number;      // リベラル
  apathetic: number;    // 無関心
};

type NewsSpec = { title: string; desc: string; effect: Partial<PublicOpinion> };


// 1) フィルター型を追加（'all' + 既存カテゴリ）
type Filter = 'all' | EventCategory;

// 選択肢を as const で一元管理（タイポ防止）
const FILTER_OPTIONS = ['all', 'news', 'sns', 'friend', 'action', 'system'] as const;

const initialEvents: TimelineEvent[] = [
  {
    id: crypto.randomUUID(),
    date: 'Day 1',
    category: 'system',
    title: '選挙まで1ヶ月。あなたの行動が世論を動かします。',
    description: '行動を選んでみましょう。',
    impact: 'neutral',
  },
];

const categoryMeta: Record<
  EventCategory,
  { label: string; color: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  news:   { label: 'ニュース', color: '#2b6cb0', Icon: FiGlobe },
  sns:    { label: 'SNS',      color: '#1da1f2', Icon: FiTwitter },
  friend: { label: '友人',     color: '#805ad5', Icon: FiUsers },
  action: { label: '行動',     color: '#2f855a', Icon: FiZap },
  system: { label: 'システム', color: '#718096', Icon: FiBell },
};

const impactLabel: Record<Impact, string> = { good: '好影響', bad: '悪影響', neutral: '中立' };
const impactColor: Record<Impact, string> = { good: '#38a169', bad: '#e53e3e', neutral: '#718096' };

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

  // 62: 友達リスト
  const [friends, setFriends] = useState<Friend[]>(makeInitialFriends());
  
  // 67: SNSフォロワー
  const [followers, setFollowers] = useState<number>(randRange(80, 150));


  // 55: ステータスを useState 管理（初期値は50基準）
  const [status, setStatus] = useState<PlayerStatus>({
    comm: 50,
    credibility: 50,
    energy: 80,
  });

  // 59: 世論を useState 管理（合計200目安にしてバランス取りやすく）
  const [opinion, setOpinion] = useState<PublicOpinion>({
    conservative: 70,
    liberal: 70,
    apathetic: 60,
  });

  // 2) useState の型を Filter に
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.category === filter)),
    [events, filter]
  );

  // 3) onChange のイベント型を明示して、Filter へ安全代入
  const handleFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const v = e.currentTarget.value as Filter; // value は string なので Filter にキャスト
    setFilter(v);
  };

  
  const fmt0 = (n: number) => Math.round(n).toString();      // 小数点なし
  const fmt1 = (n: number) => Number(n).toFixed(1);          // 1桁だけ見せたいとき用

  // NEWS
  const NEWS_POOL: NewsSpec[] = [
    { title: '経済指標が改善',   desc: '市況がやや持ち直しムード。', effect: { conservative: +0.5, liberal: +0.5, apathetic: -0.5 } },
    { title: '物価高の懸念強まる', desc: '生活実感と政府評価にギャップ。', effect: { conservative: -0.5, liberal: +0.5, apathetic: +0.5 } },
    { title: '災害対応が迅速',     desc: '政府への信頼がわずかに上向く。', effect: { conservative: +0.8, liberal: +0.3, apathetic: -0.6 } },
    { title: '外交会談が難航',     desc: '国際関係の先行きに不安。',     effect: { conservative: -0.6, liberal: -0.6, apathetic: +0.6 } },
  ];
  function maybePushNews(prob = 0.3) {
    if (Math.random() > prob) return;
  
    const spec = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
  
    setOpinion((o) => ({
      conservative: Math.max(0, Math.min(100, o.conservative + (spec.effect.conservative ?? 0))),
      liberal:      Math.max(0, Math.min(100, o.liberal      + (spec.effect.liberal ?? 0))),
      apathetic:    Math.max(0, Math.min(100, o.apathetic    + (spec.effect.apathetic ?? 0))),
    }));
  
    const date = `Day ${Math.ceil((events.length + 1) / 2)}`;
    setEvents((prev) => [
      {
        id: crypto.randomUUID(),
        date,
        category: 'news',
        title: spec.title,
        description: spec.desc,
        impact: 'neutral',
      },
      ...prev,
    ]);
  }
  const addActionEvent = (type: 'vote' | 'talk' | 'post') => {
    const date = `Day ${Math.ceil((events.length + 1) / 2)}`;
    if (type === 'vote') {
      const deltaApa = -3;
      // ステータス/世論の変化
      setStatus((s) => ({ ...s, credibility: Math.min(100, s.credibility + 2), energy: Math.max(0, s.energy - 5) })); // ← 追加
      setOpinion((o) => ({ ...o, apathetic: Math.max(0, o.apathetic + deltaApa) }));
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          date,
          category: 'action',
          title: '投票に行った',
          description: '自分の意思を示したことで周囲の関心がわずかに向上。',
          impact: 'good',
          delta: { apa: deltaApa },   
        },
        ...prev,
      ]);
      maybePushNews(); // 行動後に 30% でニュース発生
    } else if (type === 'talk') {
      // 選択UIで先頭の友達が「話す相手」
      const target = friends[0] ?? friends[Math.floor(Math.random() * friends.length)];
      if (!target) return;

      // 変化量（±1 or ±2）／無関心は下がりやすい
      const swing = () => (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2);
      const deltaCons = swing();
      const deltaLib  = swing();
      const deltaApa  = -1;

      const updated = {
        ...target,
        conservative: Math.max(0, Math.min(100, target.conservative + deltaCons)),
        liberal:      Math.max(0, Math.min(100, target.liberal + deltaLib)),
        apathetic:    Math.max(0, Math.min(100, target.apathetic + deltaApa)),
      };

      // 友達リストを更新
      setFriends(prev => prev.map(f => (f.id === target.id ? updated : f)));

      // 世論への伝播（係数0.2）
      const spread = 0.2;
      setOpinion(o => ({
        conservative: Math.max(0, Math.min(100, o.conservative + spread * deltaCons)),
        liberal:      Math.max(0, Math.min(100, o.liberal      + spread * deltaLib)),
        apathetic:    Math.max(0, Math.min(100, o.apathetic    + spread * deltaApa)),
      }));

      // ステータス
      setStatus((s) => ({ ...s, comm: Math.min(100, s.comm + 3), energy: Math.max(0, s.energy - 3) })); // ← 追加
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          date,
          category: 'friend',
          title: '友達と話した',
          description: '友達の政治傾向が少し変化。世論にも微細な波紋。',
          impact: 'neutral',
          delta: { cons: deltaCons, lib: deltaLib, apa: deltaApa },
        },
        ...prev,
      ]);
      maybePushNews(); // 行動後に 30% でニュース発生
    } else {
      const bad = Math.random() < 0.15;

      // フォロワー増減（-5〜-30 / +10〜+40）
      const deltaFollowers = bad
        ? - (5 + Math.floor(Math.random() * 26))
        :   (10 + Math.floor(Math.random() * 31));
      setFollowers(n => Math.max(0, n + deltaFollowers));

      // 影響倍率（1.0 + followers * 0.0005, 上限2.5）
      const influenceMul = Math.min(2.5, 1.0 + (followers * 0.0005));

      // 世論へ反映（倍率込）
      setOpinion((o) => ({
        conservative: Math.max(0, Math.min(100, o.conservative + (bad ? 0.5 : 0)   * influenceMul)),
        liberal:      Math.max(0, Math.min(100, o.liberal      + (bad ? -0.5 : 1) * influenceMul)),
        apathetic:    Math.max(0, Math.min(100, o.apathetic    + (bad ? 1 : -0.5) * influenceMul)),
      }));

      // ステータス
      setStatus((s) => ({
        ...s,
        comm: Math.min(100, s.comm + (bad ? -2 : 2)),
        credibility: Math.min(100, Math.max(0, s.credibility + (bad ? -4 : 1))),
        energy: Math.max(0, s.energy - 2),
      }));

      // ログ（先頭）
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          date,
          category: 'sns',
          title: 'SNSに投稿した',
          description: bad
            ? '炎上。フォロワーが減少し、信頼低下・関心後退。'
            : '反響あり。フォロワーが増加し、関心が少し高まった。',
          impact: bad ? 'bad' : 'good',
          delta: { followers: deltaFollowers },
        },
        ...prev,
      ]);
      maybePushNews(); // 行動後に 30% でニュース発生
    }
  };


  return (
    <div className="tl-container">
    {/* ステータスバー */}
      <div className="tl-statusbar">
        <div className="tl-stat">
          <span>コミュ力</span><strong>{fmt0(status.comm)}</strong>
        </div>
        <div className="tl-stat">
          <span>信頼</span><strong>{fmt0(status.credibility)}</strong>
        </div>
        <div className="tl-stat">
          <span>体力</span><strong>{fmt0(status.energy)}</strong>
        </div>
        <div className="tl-divider" />
        <div className="tl-stat">
          <span>保守</span><strong>{fmt0(opinion.conservative)}</strong>
        </div>
        <div className="tl-stat">
          <span>リベラル</span><strong>{fmt0(opinion.liberal)}</strong>
        </div>
        <div className="tl-stat">
          <span>無関心</span><strong>{fmt0(opinion.apathetic)}</strong>
        </div>
      </div>
      {/* ヘッダー / フィルター */}
      <div className="tl-header">
        <h2 className="tl-title">タイムライン</h2>
        <div className="tl-filter">
          <label>カテゴリ:</label>
          <select value={filter} onChange={handleFilterChange}>
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all'
                  ? 'すべて'
                  : opt === 'news'
                  ? 'ニュース'
                  : opt === 'sns'
                  ? 'SNS'
                  : opt === 'friend'
                  ? '友人'
                  : opt === 'action'
                  ? '行動'
                  : 'システム'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 友達選択（簡易） */}
      <div className="tl-friendsbar">
        <span>話す相手：</span>
        <select
          value={friends[0]?.id ?? ''}
          onChange={(e) => {
            // 1人目に選んだ友達を前に寄せる簡易の実装（最前にいる相手が「既定」扱い）
            const id = e.currentTarget.value;
            setFriends((prev) => {
              const idx = prev.findIndex((f) => f.id === id);
              if (idx <= 0) return prev;
              const copy = [...prev];
              const [picked] = copy.splice(idx, 1);
              return [picked, ...copy];
            });
          }}
        >
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}（保:{f.conservative}／リ:{f.liberal}／無:{f.apathetic}）
            </option>
          ))}
        </select>
        <span className="tl-followers">フォロワー {followers}</span>
      </div>


      {/* 73: スクロール領域 */}
      <div className="tl-list">
        {filtered.map((ev) => {
          const meta = categoryMeta[ev.category];
          const Icon = meta.Icon;
          return (
            <div className="tl-item" key={ev.id}>
              <div className="tl-icon" style={{ backgroundColor: meta.color }}>
                <Icon size={18} />
              </div>
              <div className="tl-body">
                <div className="tl-headline">
                  <span className="tl-date">{ev.date}</span>
                  <span className="tl-cat" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span
                    className="tl-badge"
                    style={{ backgroundColor: impactColor[ev.impact] }}
                    title={`影響度: ${impactLabel[ev.impact]}`}
                  >
                    {impactLabel[ev.impact]}
                    {ev.delta?.cons ? ` 保${ev.delta.cons > 0 ? '+' : ''}${ev.delta.cons}` : ''}
                    {ev.delta?.lib ? ` リ${ev.delta.lib > 0 ? '+' : ''}${ev.delta.lib}` : ''}
                    {ev.delta?.apa ? ` 無${ev.delta.apa > 0 ? '+' : ''}${ev.delta.apa}` : ''}
                    {ev.delta?.followers ? ` F${ev.delta.followers > 0 ? '+' : ''}${ev.delta.followers}` : ''}
                  </span>

                </div>
                <div className="tl-title-row">{ev.title}</div>
                {ev.description && <div className="tl-desc">{ev.description}</div>}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="tl-empty">このカテゴリのイベントはまだありません。</div>
        )}
      </div>

      {/* 50〜53: 行動ボタン（仮） */}
      <div className="tl-actions">
        <button onClick={() => addActionEvent('vote')}>投票に行く</button>
        <button onClick={() => addActionEvent('talk')}>友達と話す</button>
        <button onClick={() => addActionEvent('post')}>SNSに投稿</button>
      </div>
    </div>
  );
}