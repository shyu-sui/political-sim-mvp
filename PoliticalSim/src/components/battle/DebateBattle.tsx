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
  approvalDelta:     number; // チョイス累計 + 評価ボーナス
}

type EvalTier = 'excellent' | 'good' | 'average' | 'poor';

const EVAL_LABELS: Record<EvalTier, string> = {
  excellent: '優秀 ★★★★★',
  good:      '良好 ★★★☆☆',
  average:   '普通 ★★☆☆☆',
  poor:      '不十分 ★☆☆☆☆',
};
const EVAL_APPROVAL: Record<EvalTier, number> = {
  excellent: +8,
  good:      +4,
  average:    0,
  poor:      -4,
};

interface Props {
  state:   DebateState;
  onClose: (result: DebateCloseResult) => void;
}

/** 思想タイプと保守方向の相性スコア (0–1) */
function ideologyMatchScore(opp: DebateOpponent, totalConservative: number): number {
  const cons  = ['conservative', 'nationalist'];
  const liber = ['liberal', 'progressive'];
  if (cons.includes(opp.ideology))  return totalConservative > 0 ? 1 : totalConservative < 0 ? 0 : 0.5;
  if (liber.includes(opp.ideology)) return totalConservative < 0 ? 1 : totalConservative > 0 ? 0 : 0.5;
  return 0.5; // centrist
}

function calcEvalTier(
  totalPersuasion: number,
  totalConsistency: number,
  totalConservative: number,
  rounds: number,
  opp: DebateOpponent,
): EvalTier {
  const MAX_PERSUASION_PER_ROUND = 5;
  const persuasionRatio  = Math.min(1, totalPersuasion / (MAX_PERSUASION_PER_ROUND * rounds));
  const consistencyRatio = Math.min(1, Math.max(0, totalConsistency) / (rounds * 4));
  const ideologyRatio    = ideologyMatchScore(opp, totalConservative);

  const score = persuasionRatio * 50 + consistencyRatio * 25 + ideologyRatio * 25;

  if (score >= 70) return 'excellent';
  if (score >= 45) return 'good';
  if (score >= 20) return 'average';
  return 'poor';
}

export default function DebateBattle({ state: initState, onClose }: Props) {
  const [roundIdx,         setRoundIdx]         = useState(0);
  const [phase,            setPhase]            = useState<'intro' | 'showing' | 'feedback' | 'done'>('intro');
  const [feedback,         setFeedback]         = useState('');
  const [evalTier,         setEvalTier]         = useState<EvalTier>('average');
  const [finalApproval,    setFinalApproval]    = useState(0);
  const [gameResult,       setGameResult]       = useState<'win' | 'lose' | null>(null);

  const [totalConsistency,  setTotalConsistency]  = useState(0);
  const [totalConservative, setTotalConservative] = useState(0);
  const [totalApproval,     setTotalApproval]     = useState(0);
  const [totalPersuasion,   setTotalPersuasion]   = useState(0);

  const [opponent] = useState<DebateOpponent>(() =>
    DEBATE_OPPONENTS.find(o => o.name === initState.opponentName) ?? getRandomOpponent()
  );
  const [theme] = useState<DebateTheme>(() =>
    DEBATE_THEMES.find(t => t.theme === initState.topic)
    ?? getDebateThemeForOpponent(opponent)
  );

  const totalRounds   = theme.rounds.length;
  const currentRound  = theme.rounds[roundIdx];
  const catLabel      = CATEGORY_LABELS[theme.category] ?? theme.category;

  function handleChoice(idx: number) {
    if (phase !== 'showing') return;
    const { effect } = currentRound.choices[idx];

    const newConsistency  = totalConsistency  + effect.consistencyDelta;
    const newConservative = totalConservative + effect.conservativeDelta;
    const newApproval     = totalApproval     + effect.approvalDelta;
    const newPersuasion   = totalPersuasion   + effect.persuasion;

    setTotalConsistency(newConsistency);
    setTotalConservative(newConservative);
    setTotalApproval(newApproval);
    setTotalPersuasion(newPersuasion);
    setFeedback(effect.message);

    const isLastRound = roundIdx >= totalRounds - 1;

    if (isLastRound) {
      // 評価計算
      const tier   = calcEvalTier(newPersuasion, newConsistency, newConservative, totalRounds, opponent);
      const bonus  = EVAL_APPROVAL[tier];
      const finalA = newApproval + bonus;
      setEvalTier(tier);
      setFinalApproval(finalA);
      setGameResult(finalA > 0 ? 'win' : 'lose');
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
      approvalDelta:     finalApproval,
    });
  }

  // ===== イントロ =====
  if (phase === 'intro') {
    return (
      <div className="db-overlay">
        <div className="db-panel">
          <div className="db-header">
            <span className="db-tag">{catLabel}</span>
            <span className="db-topic">議題：{theme.theme}</span>
          </div>
          <div className="db-opponent-card">
            <div className="db-opp-avatar-lg">{opponent.icon}</div>
            <div className="db-opp-info">
              <div className="db-opp-name">{opponent.name}</div>
              <div className="db-opp-party">{opponent.party}</div>
            </div>
          </div>
          <div className="db-opp-bubble">
            <div className="db-opp-avatar">{opponent.icon}</div>
            <div className="db-opp-text">{theme.opponentOpening}</div>
          </div>
          <div className="db-intro-hint">全 {totalRounds} ラウンド。支持率が上がれば勝利です。</div>
          <button className="db-next-btn" onClick={() => setPhase('showing')}>討論を始める</button>
        </div>
      </div>
    );
  }

  // ===== 結果 =====
  if (phase === 'done' && gameResult) {
    const evalBonus = EVAL_APPROVAL[evalTier];
    return (
      <div className="db-overlay">
        <div className="db-panel">
          <div className="db-header">
            <span className="db-tag">{catLabel}</span>
            <span className="db-topic">{theme.theme}</span>
          </div>

          {/* 評価パネル */}
          <div className="db-eval-panel">
            <div className="db-eval-title">今回の討論評価</div>
            <div className={`db-eval-tier db-eval-${evalTier}`}>{EVAL_LABELS[evalTier]}</div>
            <div className="db-eval-rows">
              <div className="db-eval-row">
                <span className="db-eval-label">説得力スコア</span>
                <span className="db-eval-val">{totalPersuasion} pt</span>
              </div>
              {totalConsistency !== 0 && (
                <div className="db-eval-row">
                  <span className="db-eval-label">一貫性ボーナス</span>
                  <span className={`db-eval-val ${totalConsistency > 0 ? 'pos' : 'neg'}`}>
                    {totalConsistency > 0 ? '+' : ''}{totalConsistency}
                  </span>
                </div>
              )}
              {totalConservative !== 0 && (
                <div className="db-eval-row">
                  <span className="db-eval-label">思想変動</span>
                  <span className="db-eval-val">
                    {totalConservative > 0 ? '保守寄り' : 'リベラル寄り'} {Math.abs(totalConservative)}
                  </span>
                </div>
              )}
            </div>
            <div className="db-eval-approval">
              評価ボーナス　支持率
              <span className={`db-eval-bonus ${evalBonus >= 0 ? 'pos' : 'neg'}`}>
                {evalBonus >= 0 ? '+' : ''}{evalBonus}
              </span>
            </div>
          </div>

          {feedback && <div className="db-feedback-msg">{feedback}</div>}

          <div className={`db-result-banner ${gameResult === 'win' ? 'win' : 'lose'}`}>
            {gameResult === 'win' ? '🎉 討論勝利！支持率が上昇しました。' : '😔 討論敗北…支持率が下がりました。'}
          </div>

          <div className="db-result-deltas">
            <span>支持率 {finalApproval >= 0 ? '+' : ''}{finalApproval}</span>
            {totalConsistency  !== 0 && <span>一貫性 {totalConsistency  > 0 ? '+' : ''}{totalConsistency}</span>}
            {totalConservative !== 0 && <span>保守 {totalConservative > 0 ? '+' : ''}{totalConservative}</span>}
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

        <div className="db-round-info">
          ラウンド {roundIdx + 1} / {totalRounds}
          <span className="db-round-type">{currentRound.type === 'question' ? '❓ 質問' : '💬 意見'}</span>
          <span className="db-opp-name-chip">{opponent.icon} {opponent.name}</span>
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

// ファクトリー: 討論開始時の初期状態を生成
export function createDebateState(params: {
  opponentName?:  string;
  topic?:         string;
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
  };
}
