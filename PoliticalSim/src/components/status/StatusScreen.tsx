import type { BeliefScore } from '../../types/gameTypes';
import './StatusScreen.css';

interface Props {
  playerName:   string;
  charType:     string;
  beliefScore:  BeliefScore;
  approvalRate: number;
  conservative: number; // world opinion
  liberal:      number; // world opinion
  apathetic:    number;
  comm:         number;
  credibility:  number;
  energy:       number;
  followers:    number;
  day:          number;
  month:        number;
  year:         number;
  ap:           number;
  onClose:      () => void;
}

function BarRow({ label, value, max = 100, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor = color ?? (pct >= 60 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#ef4444');
  return (
    <div className="ss-bar-row">
      <div className="ss-bar-label">{label}</div>
      <div className="ss-bar-wrap">
        <div className="ss-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="ss-bar-val">{Math.floor(value)}</div>
    </div>
  );
}

export default function StatusScreen({
  playerName, charType, beliefScore, approvalRate,
  conservative, liberal, apathetic,
  comm, credibility, energy,
  followers, day, month, year, ap,
  onClose,
}: Props) {
  const playerCons = Math.floor(beliefScore.conservative);
  const playerLib  = 100 - playerCons;

  return (
    <div className="ss-overlay">
      <div className="ss-panel">
        {/* ヘッダー */}
        <div className="ss-header">
          <div className="ss-player-icon">👤</div>
          <div className="ss-player-info">
            <div className="ss-player-name">{playerName || 'プレイヤー'}</div>
            <div className="ss-player-type">{charType}</div>
          </div>
          <button className="ss-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 日時 / AP */}
        <div className="ss-time-row">
          <span>📅 Year {year} - Month {month} - Day {day}</span>
          <span>⚡ AP: {ap}</span>
          <span>👥 フォロワー: {followers.toLocaleString()}</span>
        </div>

        {/* セクション: プレイヤー保守/リベラル */}
        <div className="ss-section">
          <div className="ss-section-title">🧭 あなたの思想軸</div>
          <div className="ss-cons-lib">
            <div className="ss-cl-bar-wrap">
              <div className="ss-cl-bar-lib"  style={{ width: `${playerLib}%` }} />
              <div className="ss-cl-bar-cons" style={{ width: `${playerCons}%` }} />
            </div>
            <div className="ss-cl-labels">
              <span className="ss-cl-lib-label">リベラル {playerLib}</span>
              <span className="ss-cl-cons-label">保守 {playerCons}</span>
            </div>
          </div>
        </div>

        {/* セクション: 支持率・一貫性 */}
        <div className="ss-section">
          <div className="ss-section-title">📊 主要指標</div>
          <BarRow label="支持率" value={approvalRate} color={approvalRate >= 50 ? '#22c55e' : approvalRate >= 30 ? '#f59e0b' : '#ef4444'} />
          <BarRow label="一貫性" value={beliefScore.consistency} color={beliefScore.consistency >= 60 ? '#22c55e' : '#f59e0b'} />
        </div>

        {/* セクション: 世論 */}
        <div className="ss-section">
          <div className="ss-section-title">🌐 世論</div>
          <BarRow label="保守支持" value={conservative} color="#f97316" />
          <BarRow label="リベラル支持" value={liberal} color="#3b82f6" />
          <BarRow label="無関心層" value={apathetic} color="#94a3b8" />
        </div>

        {/* セクション: ステータス */}
        <div className="ss-section">
          <div className="ss-section-title">💪 個人ステータス</div>
          <BarRow label="コミュ力"   value={comm}        color="#a78bfa" />
          <BarRow label="信頼"       value={credibility}  color="#60a5fa" />
          <BarRow label="体力"       value={energy}       color="#34d399" />
        </div>

        {/* セクション: 信念スコア */}
        <div className="ss-section">
          <div className="ss-section-title">🎯 信念スコア</div>
          <BarRow label="経済（市場↑）"     value={beliefScore.economy}      color="#f59e0b" />
          <BarRow label="福祉（大きな政府↑）" value={beliefScore.welfare}      color="#22c55e" />
          <BarRow label="安全保障（タカ派↑）" value={beliefScore.security}     color="#ef4444" />
          <BarRow label="環境優先度"         value={beliefScore.environment}  color="#10b981" />
          <BarRow label="外交（グローバル↑）" value={beliefScore.foreign}      color="#6366f1" />
        </div>
      </div>
    </div>
  );
}
