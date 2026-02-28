// src/features/election/ElectionBanner.tsx
import type { ElectionState, ElectionCampaignPhase } from './electionLogic';
import { getCampaignPhase } from './electionLogic';

type Props = {
  state: ElectionState;
  onJoin: () => void;
  onLeave: () => void;
  onOpenCounting: () => void;  // 開票（選挙当日のみ有効）
  onShowSurvey: () => void;    // 情勢調査（期日前投票期間のみ表示）
};

const phaseLabel: Record<ElectionCampaignPhase, (daysLeft: number) => string> = {
  pre:          d => `📢 告示期間 — あと ${d} 日`,
  early_voting: d => `🗳 期日前投票中 — あと ${d} 日`,
  election_day: _  => '🗳 選挙当日！',
};

const phaseColor: Record<ElectionCampaignPhase, string> = {
  pre:          '#64748b',
  early_voting: '#d97706',
  election_day: '#dc2626',
};

export default function ElectionBanner({ state, onJoin, onLeave, onOpenCounting, onShowSurvey }: Props) {
  if (state.phase === 'idle') return null;

  const isAnnounced = state.phase === 'announced';
  const cp = isAnnounced ? getCampaignPhase(state.daysLeft) : null;

  return (
    <div className="tl-electionbar">
      <strong>選挙イベント</strong>
      <span>（Month {state.month} / Year {state.year}）</span>

      {cp && (
        <span style={{ color: phaseColor[cp], fontWeight: 700, fontSize: '0.88em', whiteSpace: 'nowrap' }}>
          {phaseLabel[cp](state.daysLeft)}
        </span>
      )}

      <div className="tl-electionbar-actions">
        {/* 参加 / 退出 */}
        {isAnnounced && !state.participating && (
          <button onClick={onJoin}>参加する</button>
        )}
        {isAnnounced && state.participating && (
          <button onClick={onLeave}>退出</button>
        )}

        {/* 期日前投票期間: 情勢調査 */}
        {isAnnounced && state.participating && cp === 'early_voting' && (
          <button onClick={onShowSurvey} className="tl-btn-survey">
            📊 情勢調査を確認する
          </button>
        )}

        {/* 選挙当日: 開票ボタン */}
        {isAnnounced && state.participating && cp === 'election_day' && (
          <button onClick={onOpenCounting} className="tl-btn-count">
            🗳 開票
          </button>
        )}

        {/* 結果表示 */}
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
