import { useState } from 'react';
import type { ScandalState, ScandalChoice } from '../../types/gameTypes';
import './ScandalEvent.css';

interface Props {
  state:   ScandalState;
  onClose: (choice: ScandalChoice) => void;
}

type ScandalPhaseUI = 'revealed' | 'investigating' | 'result';

export default function ScandalEvent({ state, onClose }: Props) {
  const [phase, setPhase]           = useState<ScandalPhaseUI>('revealed');
  const [chosen, setChosen]         = useState<ScandalChoice | null>(null);
  const [investigated, setInvestigated] = useState(false);

  function startInvestigation() {
    setPhase('investigating');
    setTimeout(() => setInvestigated(true), 1200);
  }

  function choose(choice: ScandalChoice) {
    setChosen(choice);
    setPhase('result');
  }

  // -------- 発覚フェーズ --------
  if (phase === 'revealed') {
    return (
      <div className="sc-overlay">
        <div className="sc-panel">
          <div className="sc-header">
            <span className="sc-alert-badge">⚠️ スキャンダル発生</span>
          </div>
          <div className="sc-title">{state.title}</div>
          <div className="sc-desc">{state.description}</div>
          <div className="sc-type-label">種別: {typeLabel(state.type)}</div>
          <div className="sc-hint">このままでは支持率が急落します。どう対処しますか？</div>
          <button className="sc-btn-primary" onClick={startInvestigation}>
            🔍 状況を調査する
          </button>
        </div>
      </div>
    );
  }

  // -------- 調査フェーズ --------
  if (phase === 'investigating') {
    return (
      <div className="sc-overlay">
        <div className="sc-panel">
          <div className="sc-header">
            <span className="sc-alert-badge sc-badge-info">🔍 調査中</span>
          </div>
          <div className="sc-title">情報収集・分析中…</div>
          {!investigated ? (
            <div className="sc-loader">
              <div className="sc-spinner" />
              <p>関係者へのヒアリング、記録の確認…</p>
            </div>
          ) : (
            <>
              <div className="sc-analyzed">
                <p>📁 調査完了。3つの対応策が見えてきました。</p>
                <p>それぞれにメリット・デメリットがあります。慎重に選んでください。</p>
              </div>
              <div className="sc-choices">
                {state.choices.map(ch => (
                  <button key={ch.id} className="sc-choice-btn" onClick={() => choose(ch)}>
                    <div className="sc-choice-label">{ch.label}</div>
                    <div className="sc-choice-desc">{ch.desc}</div>
                    <div className="sc-choice-preview">
                      <span style={{ color: ch.outcome.approvalDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                        支持率 {ch.outcome.approvalDelta >= 0 ? '+' : ''}{ch.outcome.approvalDelta}
                      </span>
                      <span style={{ color: ch.outcome.consistencyDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                        一貫性 {ch.outcome.consistencyDelta >= 0 ? '+' : ''}{ch.outcome.consistencyDelta}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // -------- 結果フェーズ --------
  if (!chosen) return null;
  return (
    <div className="sc-overlay">
      <div className="sc-panel">
        <div className="sc-header">
          <span className={`sc-alert-badge ${chosen.outcome.success ? 'sc-badge-ok' : 'sc-badge-fail'}`}>
            {chosen.outcome.success ? '✅ 対応成功' : '❌ 対応失敗'}
          </span>
        </div>
        <div className="sc-title">{chosen.label}</div>
        <div className="sc-outcome-msg">{chosen.outcome.message}</div>
        <div className="sc-outcome-stats">
          <div className="sc-os-row">
            <span>支持率</span>
            <span className={chosen.outcome.approvalDelta >= 0 ? 'pos' : 'neg'}>
              {chosen.outcome.approvalDelta >= 0 ? '+' : ''}{chosen.outcome.approvalDelta}
            </span>
          </div>
          <div className="sc-os-row">
            <span>一貫性</span>
            <span className={chosen.outcome.consistencyDelta >= 0 ? 'pos' : 'neg'}>
              {chosen.outcome.consistencyDelta >= 0 ? '+' : ''}{chosen.outcome.consistencyDelta}
            </span>
          </div>
          <div className="sc-os-row">
            <span>信頼</span>
            <span className={chosen.outcome.credibilityDelta >= 0 ? 'pos' : 'neg'}>
              {chosen.outcome.credibilityDelta >= 0 ? '+' : ''}{chosen.outcome.credibilityDelta}
            </span>
          </div>
        </div>
        <button className="sc-btn-primary" onClick={() => onClose(chosen)}>
          対応完了
        </button>
      </div>
    </div>
  );
}

function typeLabel(t: ScandalState['type']): string {
  const map = {
    secretary:  '秘書の不祥事',
    funds:      '資金管理問題',
    media_bias: 'メディア偏向報道',
  };
  return map[t];
}

// ファクトリー: MVP 用スキャンダル（秘書の不祥事）
export function createSecretaryScandal(): ScandalState {
  return {
    active:      true,
    type:        'secretary',
    title:       '秘書が不祥事を起こした',
    description: '選挙活動中に、あなたの秘書が有権者に不適切な発言をしたとSNSで拡散されています。対応を誤れば支持率が急落します。',
    choices: [
      {
        id: 'apologize',
        label: '即座に謝罪を公表する',
        desc:  '速やかに記者会見を開き、誠実に謝罪する。信頼回復は期待できるが、支持率は一時的に下がる。',
        outcome: {
          approvalDelta:    -5,
          consistencyDelta: +5,
          credibilityDelta: +8,
          message:          '誠実な対応が評価され、信頼が回復しました。支持率は一時的に下がりましたが、長期的な信頼は維持されます。',
          success:          true,
        },
      },
      {
        id: 'deny',
        label: 'SNSの情報を否定・無視する',
        desc:  '事実無根だと主張して黙殺する。後で証拠が出てくると致命的になるリスクがある。',
        outcome: {
          approvalDelta:    -15,
          consistencyDelta: -10,
          credibilityDelta: -12,
          message:          '後日、証拠が次々に出てきて大炎上。信頼が大幅に低下しました。',
          success:          false,
        },
      },
      {
        id: 'investigate',
        label: '内部調査を表明して透明性を保つ',
        desc:  '「独立した第三者機関による調査を実施する」と表明する。時間はかかるが誠実な印象を与える。',
        outcome: {
          approvalDelta:    +3,
          consistencyDelta: +3,
          credibilityDelta: +5,
          message:          '透明性を重視した対応が支持者から高く評価されました。支持率がわずかに上昇。',
          success:          true,
        },
      },
    ],
  };
}
