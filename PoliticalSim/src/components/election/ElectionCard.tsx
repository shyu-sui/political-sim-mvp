// src/features/election/ElectionCard.tsx
// import React from 'react';

type Props = {
  dateLabel: string;
  onJoin: () => void;
  onOpenVoting: () => void;
};

export default function ElectionCard({ dateLabel, onJoin, onOpenVoting }: Props) {
  return (
    <div className="tl-item tl-election">
      <div className="tl-icon" style={{ backgroundColor: '#fb923c' }}>🗳</div>
      <div className="tl-body">
        <div className="tl-headline">
          <span className="tl-date">{dateLabel}</span>
          <span className="tl-cat" style={{ color: '#fb923c' }}>選挙</span>
        </div>
        <div className="tl-title-row">選挙が公示されました</div>
        <div className="tl-desc">参加して投票行動に移れます。</div>
        <div style={{ display:'flex', gap:8, marginTop:6 }}>
          <button onClick={onJoin}>参加する</button>
          <button onClick={onOpenVoting}>投票へ</button>
        </div>
      </div>
    </div>
  );
}