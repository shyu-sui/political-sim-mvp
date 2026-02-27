import { useEffect, useState } from 'react';
import './VotingAnimation.css';

interface Props {
  playerName: string;
  playerShare: number;
  rivalName:  string;
  rivalShare:  number;
  turnout:     number;
  won:         boolean;
  onClose:     () => void;
}

const STEPS    = 60;   // アニメーションのステップ数
const INTERVAL = 45;   // ms/step → 合計 ~2.7 秒

export default function VotingAnimation({
  playerName, playerShare, rivalName, rivalShare, turnout, won, onClose,
}: Props) {
  const [dispPlayer, setDispPlayer] = useState(0);
  const [dispRival,  setDispRival]  = useState(0);
  const [phase, setPhase] = useState<'counting' | 'done'>('counting');

  useEffect(() => {
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const t = step / STEPS;
      // 前半は両者ほぼ互角、後半で差がつく演出
      const eased = t < 0.6 ? t * 0.8 : 0.48 + (t - 0.6) * 1.3;
      const progress = Math.min(eased, 1);
      setDispPlayer(Math.floor(playerShare * progress));
      setDispRival( Math.floor(rivalShare  * progress));
      if (step >= STEPS) {
        clearInterval(timer);
        setDispPlayer(playerShare);
        setDispRival(rivalShare);
        setPhase('done');
      }
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [playerShare, rivalShare]);

  const maxShare = Math.max(playerShare, rivalShare, 1);

  return (
    <div className="va-overlay">
      <div className="va-panel">
        <div className="va-header">
          <span className="va-icon">🗳</span>
          <span className="va-title">開票速報</span>
          <span className="va-turnout">投票率 {turnout}%</span>
        </div>

        <div className="va-bars">
          {/* プレイヤー */}
          <div className="va-row">
            <span className="va-name va-name-player">{playerName}</span>
            <div className="va-bar-bg">
              <div
                className="va-bar va-bar-player"
                style={{ width: `${(dispPlayer / maxShare) * 100}%` }}
              />
            </div>
            <span className="va-pct">{dispPlayer}%</span>
          </div>

          {/* ライバル */}
          <div className="va-row">
            <span className="va-name va-name-rival">{rivalName}</span>
            <div className="va-bar-bg">
              <div
                className="va-bar va-bar-rival"
                style={{ width: `${(dispRival / maxShare) * 100}%` }}
              />
            </div>
            <span className="va-pct">{dispRival}%</span>
          </div>
        </div>

        {/* 50% ライン */}
        <div className="va-threshold-line">
          <span>当選ライン 50%</span>
        </div>

        <div className={`va-status ${phase === 'counting' ? 'va-counting' : won ? 'va-win' : 'va-lose'}`}>
          {phase === 'counting'
            ? '⏳ 開票中...'
            : won
              ? '🎉 当選おめでとうございます！'
              : '😔 惜敗です...'}
        </div>

        {phase === 'done' && (
          <button className="va-close-btn" onClick={onClose}>
            タイムラインに戻る
          </button>
        )}
      </div>
    </div>
  );
}
