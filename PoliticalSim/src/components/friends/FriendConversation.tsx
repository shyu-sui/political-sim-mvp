import { useState } from 'react';
import type { FriendChar } from './FriendChars';
import './friends.css';

export interface FriendConvResult {
  conservativeDelta: number;
  consistencyDelta:  number;
  approvalDelta:     number;
  commDelta:         number;
  charName:          string;
}

interface Props {
  char:     FriendChar;
  onClose:  (result: FriendConvResult) => void;
}

type Phase = 'intro' | 'exchange' | 'charReply' | 'done';

export default function FriendConversation({ char, onClose }: Props) {
  const [exchangeIdx, setExchangeIdx] = useState(0);
  const [phase,       setPhase]       = useState<Phase>('intro');
  const [charReply,   setCharReply]   = useState('');

  type Totals = {
    conservativeDelta: number;
    consistencyDelta:  number;
    approvalDelta:     number;
    commDelta:         number;
  };
  const [totals, setTotals] = useState<Totals>({
    conservativeDelta: 0,
    consistencyDelta:  0,
    approvalDelta:     0,
    commDelta:         0,
  });

  const totalExchanges = char.exchanges.length;
  const currentExchange = char.exchanges[exchangeIdx];
  const isSpecial = char.ideologyType === '政治に興味がない';

  function handleChoice(idx: number) {
    if (phase !== 'exchange') return;
    const choice = currentExchange.choices[idx];
    const { effect } = choice;

    setTotals(prev => ({
      conservativeDelta: prev.conservativeDelta + effect.conservativeDelta,
      consistencyDelta:  prev.consistencyDelta  + effect.consistencyDelta,
      approvalDelta:     prev.approvalDelta     + effect.approvalDelta,
      commDelta:         prev.commDelta         + (effect.commDelta ?? 0),
    }));

    setCharReply(choice.charResponse);
    setPhase('charReply');
  }

  function handleNextExchange() {
    if (exchangeIdx >= totalExchanges - 1) {
      setPhase('done');
    } else {
      setExchangeIdx(i => i + 1);
      setPhase('exchange');
      setCharReply('');
    }
  }

  function handleClose() {
    onClose({
      conservativeDelta: totals.conservativeDelta,
      consistencyDelta:  totals.consistencyDelta,
      approvalDelta:     totals.approvalDelta,
      commDelta:         totals.commDelta,
      charName:          char.name,
    });
  }

  // ===== イントロ =====
  if (phase === 'intro') {
    return (
      <div className="fc-overlay">
        <div className="fc-panel">
          <div className="fc-char-header">
            <div className="fc-char-icon">{char.icon}</div>
            <div className="fc-char-info">
              <div className="fc-char-name">{char.name}</div>
            </div>
          </div>
          <div className="fc-bubble fc-bubble-left">
            <p>{char.opening}</p>
          </div>
          <button className="fc-btn-next" onClick={() => setPhase('exchange')}>
            話を続ける →
          </button>
        </div>
      </div>
    );
  }

  // ===== 会話終了 =====
  if (phase === 'done') {
    return (
      <div className="fc-overlay">
        <div className="fc-panel">
          <div className="fc-char-header">
            <div className="fc-char-icon">{char.icon}</div>
            <div className="fc-char-name">{char.name}との会話が終わりました</div>
          </div>
          <div className="fc-result-deltas">
            {totals.conservativeDelta !== 0 && (
              <div className="fc-delta-row">
                <span className="fc-delta-label">保守度</span>
                <span className={`fc-delta-val ${totals.conservativeDelta > 0 ? 'pos' : 'neg'}`}>
                  {totals.conservativeDelta > 0 ? '+' : ''}{totals.conservativeDelta}
                </span>
              </div>
            )}
            {totals.consistencyDelta !== 0 && (
              <div className="fc-delta-row">
                <span className="fc-delta-label">一貫性</span>
                <span className={`fc-delta-val ${totals.consistencyDelta > 0 ? 'pos' : 'neg'}`}>
                  {totals.consistencyDelta > 0 ? '+' : ''}{totals.consistencyDelta}
                </span>
              </div>
            )}
            {totals.approvalDelta !== 0 && (
              <div className="fc-delta-row">
                <span className="fc-delta-label">支持率影響</span>
                <span className={`fc-delta-val ${totals.approvalDelta > 0 ? 'pos' : 'neg'}`}>
                  {totals.approvalDelta > 0 ? '+' : ''}{totals.approvalDelta}
                </span>
              </div>
            )}
            {(totals.commDelta ?? 0) !== 0 && (
              <div className="fc-delta-row">
                <span className="fc-delta-label">コミュ力</span>
                <span className={`fc-delta-val ${(totals.commDelta ?? 0) > 0 ? 'pos' : 'neg'}`}>
                  {(totals.commDelta ?? 0) > 0 ? '+' : ''}{totals.commDelta}
                </span>
              </div>
            )}
          </div>
          <button className="fc-btn-close" onClick={handleClose}>閉じる</button>
        </div>
      </div>
    );
  }

  // ===== キャラ返答 =====
  if (phase === 'charReply') {
    return (
      <div className="fc-overlay">
        <div className="fc-panel">
          <div className="fc-char-header">
            <div className="fc-char-icon">{char.icon}</div>
            <div className="fc-char-name">{char.name}</div>
            <div className="fc-progress">
              {exchangeIdx + 1} / {totalExchanges}
            </div>
          </div>
          <div className="fc-bubble fc-bubble-left">
            <p>{charReply}</p>
          </div>
          <button
            className="fc-btn-next"
            onClick={handleNextExchange}
          >
            {exchangeIdx >= totalExchanges - 1 ? '会話を終える' : '続きを話す →'}
          </button>
        </div>
      </div>
    );
  }

  // ===== 選択肢表示 =====
  if (!currentExchange) return null;

  const isPlayerAsks = currentExchange.type === 'playerAsks';

  return (
    <div className="fc-overlay">
      <div className="fc-panel">
        <div className="fc-char-header">
          <div className="fc-char-icon">{char.icon}</div>
          <div className="fc-char-name">{char.name}</div>
          <div className="fc-progress">
            {exchangeIdx + 1} / {totalExchanges}
          </div>
        </div>

        {isPlayerAsks ? (
          // プレイヤーが質問する形式（政治無関心）
          <>
            <div className="fc-player-asks-hint">
              {isSpecial ? '💬 何か話題を振ってみる' : currentExchange.charText}
            </div>
            <div className="fc-choices">
              {currentExchange.choices.map((ch, i) => (
                <button
                  key={i}
                  className="fc-choice-btn fc-player-choice"
                  onClick={() => handleChoice(i)}
                >
                  あなた：「{ch.label}」
                </button>
              ))}
            </div>
          </>
        ) : (
          // キャラが話す形式
          <>
            <div className="fc-bubble fc-bubble-left">
              <p>{currentExchange.charText}</p>
            </div>
            <div className="fc-choices">
              {currentExchange.choices.map((ch, i) => (
                <button
                  key={i}
                  className="fc-choice-btn"
                  onClick={() => handleChoice(i)}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
