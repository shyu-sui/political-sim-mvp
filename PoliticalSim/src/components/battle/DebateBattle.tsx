import { useState } from 'react';
import type { DebateState } from '../../types/gameTypes';
import {
  DEBATE_OPPONENTS, DEBATE_THEMES, getDebateThemeForOpponent, getRandomOpponent,
  CATEGORY_LABELS,
  type DebateTheme, type DebateOpponent,
} from '../config/debateTopics';
import './DebateBattle.css';

export interface DebateCloseResult {
  result:            'win' | 'lose';
  consistencyDelta:  number;
  conservativeDelta: number;
  approvalDelta:     number;
}

interface Props {
  state:   DebateState;
  onClose: (result: DebateCloseResult) => void;
}

function hpColor(hp: number, max: number) {
  const pct = hp / max;
  if (pct > 0.5) return '#22c55e';
  if (pct > 0.25) return '#f59e0b';
  return '#ef4444';
}

export default function DebateBattle({ state: initState, onClose }: Props) {
  const [playerHP,   setPlayerHP]   = useState(initState.playerHP);
  const [opponentHP, setOpponentHP] = useState(initState.opponentHP);
  const [roundIdx,   setRoundIdx]   = useState(0);
  const [phase,      setPhase]      = useState<'intro' | 'showing' | 'feedback' | 'done'>('intro');
  const [feedback,   setFeedback]   = useState('');
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);

  const [totalConsistency,  setTotalConsistency]  = useState(0);
  const [totalConservative, setTotalConservative] = useState(0);
  const [totalApproval,     setTotalApproval]     = useState(0);

  const [opponent] = useState<DebateOpponent>(() =>
    DEBATE_OPPONENTS.find(o => o.name === initState.opponentName) ?? getRandomOpponent()
  );
  const [theme] = useState<DebateTheme>(() =>
    DEBATE_THEMES.find(t => t.theme === initState.topic)
    ?? getDebateThemeForOpponent(opponent)
  );

  const maxHP = initState.maxHP;
  const totalRounds = theme.rounds.length;
  const currentRound = theme.rounds[roundIdx];

  function handleChoice(idx: number) {
    if (phase !== 'showing') return;
    const { effect } = currentRound.choices[idx];

    const newPlayerHP   = Math.max(0, Math.min(maxHP, playerHP   + effect.playerHPDelta));
    const newOpponentHP = Math.max(0, Math.min(maxHP, opponentHP + effect.opponentHPDelta));

    setPlayerHP(newPlayerHP);
    setOpponentHP(newOpponentHP);
    setTotalConsistency(d  => d + effect.consistencyDelta);
    setTotalConservative(d => d + effect.conservativeDelta);
    setTotalApproval(d     => d + effect.approvalDelta);
    setFeedback(effect.message);

    if (newOpponentHP <= 0) {
      setGameResult('win');
      setPhase('done');
    } else if (newPlayerHP <= 0) {
      setGameResult('lose');
      setPhase('done');
    } else if (roundIdx >= totalRounds - 1) {
      setGameResult(newPlayerHP >= newOpponentHP ? 'win' : 'lose');
      setPhase('done');
    } else {
      setPhase('feedback');
    }
  }

  function handleNextRound() {
    setRoundIdx(r => r + 1);
    setPhase('showing');
    setFeedback('');
  }

  function handleClose() {
    if (!gameResult) return;
    onClose({
      result:            gameResult,
      consistencyDelta:  totalConsistency,
      conservativeDelta: totalConservative,
      approvalDelta:     totalApproval,
    });
  }

  const catLabel = CATEGORY_LABELS[theme.category] ?? theme.category;

  // ===== 共通HP表示 =====
  function HPArea() {
    return (
      <div className="db-hp-area">
        <div className="db-fighter db-player">
          <div className="db-fighter-name">あなた</div>
          <div className="db-hp-bar-wrap">
            <div className="db-hp-bar-fill" style={{ width: `${(playerHP / maxHP) * 100}%`, background: hpColor(playerHP, maxHP) }} />
          </div>
          <div className="db-hp-num">{playerHP} / {maxHP}</div>
        </div>
        <div className="db-vs">VS</div>
        <div className="db-fighter db-opponent">
          <div className="db-fighter-name">{opponent.icon} {opponent.name}</div>
          <div className="db-fighter-party">{opponent.party}</div>
          <div className="db-hp-bar-wrap">
            <div className="db-hp-bar-fill" style={{ width: `${(opponentHP / maxHP) * 100}%`, background: hpColor(opponentHP, maxHP) }} />
          </div>
          <div className="db-hp-num">{opponentHP} / {maxHP}</div>
        </div>
      </div>
    );
  }

  // ===== イントロ =====
  if (phase === 'intro') {
    return (
      <div className="db-overlay">
        <div className="db-panel">
          <div className="db-header">
            <span className="db-tag">{catLabel}</span>
            <span className="db-topic">今回の議題：{theme.theme}</span>
          </div>
          <HPArea />
          <div className="db-opp-bubble">
            <div className="db-opp-avatar">{opponent.icon}</div>
            <div className="db-opp-text">{theme.opponentOpening}</div>
          </div>
          <div className="db-intro-hint">全 {totalRounds} ラウンドの討論です。選択肢を選んで討論しましょう。</div>
          <button className="db-next-btn" onClick={() => setPhase('showing')}>討論を始める</button>
        </div>
      </div>
    );
  }

  // ===== 結果 =====
  if (phase === 'done' && gameResult) {
    return (
      <div className="db-overlay">
        <div className="db-panel">
          <div className="db-header">
            <span className="db-tag">{catLabel}</span>
            <span className="db-topic">{theme.theme}</span>
          </div>
          <HPArea />
          {feedback && <div className="db-feedback-msg">{feedback}</div>}
          <div className={`db-result-banner ${gameResult === 'win' ? 'win' : 'lose'}`}>
            {gameResult === 'win' ? '🎉 討論勝利！' : '😔 討論敗北…'}
          </div>
          <div className="db-result-deltas">
            {totalConsistency  !== 0 && <span>一貫性 {totalConsistency  > 0 ? '+' : ''}{totalConsistency}</span>}
            {totalConservative !== 0 && <span>保守 {totalConservative > 0 ? '+' : ''}{totalConservative}</span>}
            {totalApproval     !== 0 && <span>支持率 {totalApproval   > 0 ? '+' : ''}{totalApproval}</span>}
          </div>
          <button className="db-close-btn" onClick={handleClose}>閉じる</button>
        </div>
      </div>
    );
  }

  // ===== ラウンド進行 =====
  return (
    <div className="db-overlay">
      <div className="db-panel">
        <div className="db-header">
          <span className="db-tag">{catLabel}</span>
          <span className="db-topic">{theme.theme}</span>
        </div>
        <HPArea />
        <div className="db-round-info">
          ラウンド {roundIdx + 1} / {totalRounds}
          <span className="db-round-type">{currentRound.type === 'question' ? '❓ 質問' : '💬 意見'}</span>
        </div>

        {phase === 'showing' && (
          <>
            <div className="db-opp-bubble">
              <div className="db-opp-avatar">{opponent.icon}</div>
              <div className="db-opp-text">{currentRound.opponentText}</div>
            </div>
            <div className="db-choices">
              {currentRound.choices.map((ch, i) => (
                <button key={i} className="db-choice-btn" onClick={() => handleChoice(i)}>
                  {ch.label}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'feedback' && (
          <div className="db-feedback-panel">
            <div className="db-feedback-msg">{feedback}</div>
            <button className="db-next-btn" onClick={handleNextRound}>次のラウンドへ →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ファクトリー: 討論バトル開始時の初期状態を生成
export function createDebateState(params: {
  opponentName?:  string;
  opponentParty?: string;
  topic?:         string;
  opponentHP?:    number;
}): import('../../types/gameTypes').DebateState {
  const opponent = params.opponentName
    ? (DEBATE_OPPONENTS.find(o => o.name === params.opponentName) ?? getRandomOpponent())
    : getRandomOpponent();
  const theme = params.topic
    ? (DEBATE_THEMES.find(t => t.theme === params.topic) ?? getDebateThemeForOpponent(opponent))
    : getDebateThemeForOpponent(opponent);

  return {
    active:        true,
    opponentName:  opponent.name,
    opponentParty: opponent.party,
    topic:         theme.theme,
    playerHP:      100,
    opponentHP:    params.opponentHP ?? 80,
    maxHP:         100,
    shielded:      false,
    turn:          'player',
    log:           [],
  };
}
