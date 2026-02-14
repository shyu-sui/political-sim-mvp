
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
};


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


// 1) フィルター型を追加（'all' + 既存カテゴリ）
type Filter = 'all' | EventCategory;

// 選択肢を as const で一元管理（タイポ防止）
const FILTER_OPTIONS = ['all', 'news', 'sns', 'friend', 'action', 'system'] as const;

const initialEvents: TimelineEvent[] = [/* …あなたの既存の初期イベント… */];

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

  const addActionEvent = (type: 'vote' | 'talk' | 'post') => {
    const date = `Day ${Math.ceil((events.length + 1) / 2)}`;
    if (type === 'vote') {
      // ステータス/世論の変化
      setStatus((s) => ({ ...s, credibility: Math.min(100, s.credibility + 2), energy: Math.max(0, s.energy - 5) })); // ← 追加
      setOpinion((o) => ({ ...o, apathetic: Math.max(0, o.apathetic - 3) })); // ← 追加
      setEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date,
          category: 'action',
          title: '投票に行った',
          description: '自分の意思を示したことで周囲の関心がわずかに向上。',
          impact: 'good',
        },
      ]);
    } else if (type === 'talk') {
      setStatus((s) => ({ ...s, comm: Math.min(100, s.comm + 3), energy: Math.max(0, s.energy - 3) })); // ← 追加
      // 友人と議論すると保守/リベラルが双方微動、無関心が少し減る
      setOpinion((o) => ({
        ...o,
        conservative: Math.min(100, o.conservative + (Math.random() < 0.5 ? 1 : 0)),
        liberal: Math.min(100, o.liberal + (Math.random() < 0.5 ? 1 : 0)),
        apathetic: Math.max(0, o.apathetic - 1),
      })); // ← 追加

      setEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date,
          category: 'friend',
          title: '友達と話した',
          description: '友達の政治傾向が少し変化。世論にも微細な波紋。',
          impact: 'neutral',
        },
      ]);
    } else {
      const bad = Math.random() < 0.15;
      setStatus((s) => ({
        ...s,
        comm: Math.min(100, s.comm + (bad ? -2 : 2)),
        credibility: Math.min(100, Math.max(0, s.credibility + (bad ? -4 : 1))),
        energy: Math.max(0, s.energy - 2),
      })); // ← 追加
      setOpinion((o) => ({
        ...o,
        liberal: Math.min(100, o.liberal + (bad ? -1 : 2)),
        conservative: Math.min(100, o.conservative + (bad ? 1 : 0)),
        apathetic: Math.max(0, o.apathetic + (bad ? 2 : -1)),
      })); // ← 追加

      setEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date,
          category: 'sns',
          title: 'SNSに投稿した',
          description: 'フォロワーがわずかに増加。稀に炎上の可能性。',
          impact: Math.random() < 0.15 ? 'bad' : 'good',
        },
      ]);
    }
  };


  return (
    <div className="tl-container">
    {/* ステータスバー */}
      <div className="tl-statusbar">
        <div className="tl-stat">
          <span>コミュ力</span><strong>{status.comm}</strong>
        </div>
        <div className="tl-stat">
          <span>信頼</span><strong>{status.credibility}</strong>
        </div>
        <div className="tl-stat">
          <span>体力</span><strong>{status.energy}</strong>
        </div>
        <div className="tl-divider" />
        <div className="tl-stat">
          <span>保守</span><strong>{opinion.conservative}</strong>
        </div>
        <div className="tl-stat">
          <span>リベラル</span><strong>{opinion.liberal}</strong>
        </div>
        <div className="tl-stat">
          <span>無関心</span><strong>{opinion.apathetic}</strong>
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