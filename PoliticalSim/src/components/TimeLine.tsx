
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