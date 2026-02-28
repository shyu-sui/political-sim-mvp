// src/features/election/ElectionCard.tsx
import { getCampaignPhase } from './electionLogic';

type Props = {
  dateLabel: string;
  daysLeft: number;
  participating: boolean;
  onJoin: () => void;
  onShowSurvey: () => void;
  onOpenCounting: () => void;
};

const phaseInfo = {
  pre: {
    label: '📢 告示期間',
    color: '#64748b',
    desc: (d: number) => `街頭演説・討論会で支持を集めましょう（あと ${d} 日）`,
  },
  early_voting: {
    label: '🗳 期日前投票中',
    color: '#d97706',
    desc: (d: number) => `一貫性が高いほど支持率が上がります（あと ${d} 日）`,
  },
  election_day: {
    label: '🗳 選挙当日！',
    color: '#dc2626',
    desc: (_: number) => '本日が投票日です。開票できます。',
  },
};

export default function ElectionCard({ dateLabel, daysLeft, participating, onJoin, onShowSurvey, onOpenCounting }: Props) {
  const cp = getCampaignPhase(daysLeft);
  const info = phaseInfo[cp];

  return (
    <div className="tl-item tl-election">
      <div className="tl-icon" style={{ backgroundColor: '#fb923c' }}>🗳</div>
      <div className="tl-body">
        <div className="tl-headline">
          <span className="tl-date">{dateLabel}</span>
          <span className="tl-cat" style={{ color: '#fb923c' }}>選挙</span>
          <span style={{ color: info.color, fontSize: '0.82em', fontWeight: 700 }}>
            {info.label}
          </span>
        </div>
        <div className="tl-title-row">選挙が公示されました</div>
        <div className="tl-desc">{info.desc(daysLeft)}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {!participating && (
            <button onClick={onJoin}>参加する</button>
          )}
          {participating && cp === 'early_voting' && (
            <button onClick={onShowSurvey}>📊 情勢調査</button>
          )}
          {participating && cp === 'election_day' && (
            <button
              onClick={onOpenCounting}
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}
            >
              🗳 開票
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
