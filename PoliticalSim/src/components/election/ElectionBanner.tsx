// src/features/election/ElectionBanner.tsx
// import React from 'react';
import type { ElectionState } from './electionLogic';

type Props = {
  state: ElectionState;
  onJoin: () => void;
  onLeave: () => void;
  onOpenVoting: () => void;
  onClose?: () => void; // バナーを閉じたいとき（任意）
};

export default function ElectionBanner({ state, onJoin, onLeave, onOpenVoting }: Props) {
  if (state.phase === 'idle') return null;

  return (
    <div className="tl-electionbar">
      <strong>選挙イベント</strong>
      <span>（Month {state.month} / Year {state.year}）</span>
      <div className="tl-electionbar-actions">
        {!state.participating && <button onClick={onJoin}>参加する</button>}
        {state.participating && <button onClick={onLeave}>退出</button>}
        {state.phase === 'announced' && state.participating && (
          <button onClick={onOpenVoting}>投票へ</button>
        )}
        {state.phase === 'result' && state.lastResult && (
          <span>
            結果: {state.lastResult.won ? '当選' : '惜敗'}
            （投票率 {state.lastResult.turnout}% / 得票率 {state.lastResult.voteShare}%）
          </span>
        )}
      </div>
    </div>
  );
}