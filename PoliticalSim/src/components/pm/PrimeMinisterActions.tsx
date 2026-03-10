import { useState } from 'react';
import './pm.css';

export interface PmActionResult {
  approvalDelta:      number;
  consistencyDelta:   number;
  partyAffinityDelta: number;
  followersDelta:     number;
  policyScoreDelta:   number;
  diplomacyDelta:     number;
  economyDelta:       number;
  securityDelta:      number;
  coalitionDelta:     number;
  pmScandalOccurred:  boolean;
  eventTitle:         string;
  eventDesc:          string;
  impact:             'good' | 'bad' | 'neutral';
}

interface Props {
  diplomacyScore:     number;
  economyScore:       number;
  securityScore:      number;
  coalitionStability: number;
  cabinetTerm:        number;
  cabinetTurn:        number;
  onAction:           (result: PmActionResult) => void;
}

type ActionType = 'cabinet' | 'diplomacy' | 'economy' | 'security' | 'coalition' | 'media';
type Phase = 'select' | 'sub' | 'result';

const CABINET_AGENDAS = [
  { label: '経済政策の方針確定',  economy: 4,  approval: 1, policy: 2 },
  { label: '外交方針の確認',      diplomacy: 4, approval: 1, policy: 2 },
  { label: '安全保障の見直し',    security: 4,  approval: 1, policy: 2 },
  { label: '社会保障の充実',      approval: 4,  economy: -1, policy: 2 },
  { label: '災害対応計画の整備',  security: 3,  approval: 3, policy: 1 },
];

const DIPLOMACY_OPTIONS = [
  {
    label: '日米首脳会談（安保強化）',
    desc: '同盟関係を強化し、抑止力を高める。',
    diplomacy: 5, security: 3, approval: 1,
  },
  {
    label: '日中経済対話（協調路線）',
    desc: '経済関係の改善を優先するが、安保面でリスクも。',
    diplomacy: 3, economy: 5, security: -2, approval: -1, coalition: 1,
  },
  {
    label: '近隣国との信頼構築外交',
    desc: '歴史・文化交流で関係改善を図る。',
    diplomacy: 4, approval: 2, security: 1, coalition: 1,
  },
  {
    label: '国際気候変動サミット主導',
    desc: '環境分野でのリーダーシップを発揮する。',
    diplomacy: 5, approval: 2, economy: -1, coalition: 1,
  },
  {
    label: '歴史問題で強硬姿勢',
    desc: '保守層には響くが、国際関係の摩擦リスクあり。',
    diplomacy: -3, approval: 4, security: 1, coalition: -1,
  },
];

const ECONOMY_OPTIONS = [
  {
    label: '財政出動・景気刺激策',
    desc: '短期の景気回復を優先。将来の財政悪化リスクあり。',
    economy: 5, approval: 4, followers: 150, coalition: 1,
  },
  {
    label: '緊縮財政・財政再建',
    desc: '長期的な財政健全化。短期的には景気に逆風。',
    economy: 2, approval: -3, policy: 3, coalition: -1,
  },
  {
    label: '減税政策',
    desc: '家計を直接支援し、消費を喚起する。',
    economy: 3, approval: 5, followers: 200,
  },
  {
    label: '規制緩和・民間活力推進',
    desc: 'ビジネス環境の改善で中長期的な成長を狙う。',
    economy: 4, policy: 2, approval: 1,
  },
  {
    label: '物価対策・生活支援補助金',
    desc: '即効性は高いが、財政負担も大きい。',
    economy: 2, approval: 5, followers: 250,
  },
  {
    label: '社会保障拡充',
    desc: '福祉向上で生活の安心感を高める。連立にも好影響。',
    approval: 3, coalition: 3, economy: -1,
  },
];

const SECURITY_OPTIONS = [
  {
    label: '防衛費増額（GDP比2%へ）',
    desc: '抑止力を強化するが、近隣諸国の懸念を招く可能性。',
    security: 6, diplomacy: -3, approval: 1, coalition: -1,
  },
  {
    label: '安全保障法制の整備・強化',
    desc: '法的基盤を固める。支持層は分かれる。',
    security: 5, policy: 3, approval: -2,
  },
  {
    label: '災害対策・危機管理強化',
    desc: '国民の安心感を高める。支持率向上につながりやすい。',
    security: 4, approval: 4, followers: 100,
  },
  {
    label: 'サイバーセキュリティ強化',
    desc: 'デジタル時代の安全保障の要。経済にも好影響。',
    security: 4, economy: 2, approval: 2,
  },
  {
    label: '防衛費抑制・平和外交重視',
    desc: '財政を守り、外交的解決を優先する方針。',
    security: -2, diplomacy: 3, approval: 3, coalition: 1,
  },
];

const COALITION_OPTIONS = [
  {
    label: '閣僚ポスト配分で譲歩',
    desc: '連立相手に要職を与え、関係を安定させる。',
    coalition: 8, partyAffinity: 5, approval: -1,
  },
  {
    label: '政策協力を丁寧に要請',
    desc: '法案審議への協力を求める。穏健な交渉路線。',
    coalition: 4, partyAffinity: 3, policy: 2,
  },
  {
    label: '強気の首脳会談（圧力路線）',
    desc: '主導権を握るが、関係悪化のリスクもある。',
    coalition: -4, partyAffinity: -3, approval: 2,
  },
  {
    label: '選挙での協力を約束',
    desc: '次の選挙での協力を確約し、連立を安定させる。',
    coalition: 6, partyAffinity: 4, followers: 50,
  },
];

const MEDIA_OPTIONS = [
  {
    label: '誠実な通常会見',
    desc: '政策の進捗を丁寧に説明する。安定した好感度向上。',
    approval: 3, diplomacy: 1, followers: 100, scandal: false,
  },
  {
    label: '国民感情に寄り添う会見',
    desc: '市民の声を前面に出した会見スタイル。支持率を大きく押し上げる。',
    approval: 5, followers: 250, coalition: 1, scandal: false,
  },
  {
    label: '強気に反論・反撃会見',
    desc: '批判に真っ向から対抗。成功すれば支持増、失敗すれば炎上。',
    approval: 0, followers: 0, scandalRisk: true, scandal: false, risky: true,
  },
  {
    label: '国際共同会見（多言語発信）',
    desc: '国際社会へのメッセージを発信。外交評価と認知度が向上。',
    approval: 2, diplomacy: 4, followers: 150, coalition: 1, scandal: false,
  },
  {
    label: 'スキャンダル対応（真摯に謝罪）',
    desc: 'ミスを認めて信頼回復を狙う。短期的な痛みを受け入れる。',
    approval: 3, policy: -1, followers: -50, scandal: false,
  },
];

export default function PrimeMinisterActions({
  diplomacyScore, economyScore, securityScore, coalitionStability,
  cabinetTerm, cabinetTurn, onAction,
}: Props) {
  const [phase,      setPhase]      = useState<Phase>('select');
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [result,     setResult]     = useState<PmActionResult | null>(null);
  const [feedback,   setFeedback]   = useState('');

  function commit(res: PmActionResult, fb: string) {
    setResult(res);
    setFeedback(fb);
    setPhase('result');
  }

  // ===== 閣議 =====
  function handleCabinet(agenda: typeof CABINET_AGENDAS[0]) {
    commit({
      approvalDelta:      agenda.approval ?? 0,
      consistencyDelta:   1,
      partyAffinityDelta: 1,
      followersDelta:     0,
      policyScoreDelta:   agenda.policy ?? 0,
      diplomacyDelta:     agenda.diplomacy ?? 0,
      economyDelta:       agenda.economy ?? 0,
      securityDelta:      agenda.security ?? 0,
      coalitionDelta:     0,
      pmScandalOccurred:  false,
      eventTitle:         `閣議：「${agenda.label}」を決定`,
      eventDesc:          '各省庁との調整を経て方針が確定した。政策実績が着実に積み上がっている。',
      impact: 'good',
    }, '閣議を開き、国家の方針を定めました。');
  }

  // ===== 外交 =====
  function handleDiplomacy(opt: typeof DIPLOMACY_OPTIONS[0]) {
    commit({
      approvalDelta:      opt.approval ?? 0,
      consistencyDelta:   1,
      partyAffinityDelta: 0,
      followersDelta:     0,
      policyScoreDelta:   0,
      diplomacyDelta:     opt.diplomacy ?? 0,
      economyDelta:       opt.economy ?? 0,
      securityDelta:      opt.security ?? 0,
      coalitionDelta:     0,
      pmScandalOccurred:  false,
      eventTitle:         `外交：${opt.label}`,
      eventDesc:          opt.desc,
      impact: (opt.diplomacy ?? 0) >= 0 ? 'good' : 'bad',
    }, `${opt.label}を実施しました。`);
  }

  // ===== 経済政策 =====
  function handleEconomy(opt: typeof ECONOMY_OPTIONS[0]) {
    commit({
      approvalDelta:      opt.approval ?? 0,
      consistencyDelta:   1,
      partyAffinityDelta: 0,
      followersDelta:     opt.followers ?? 0,
      policyScoreDelta:   opt.policy ?? 0,
      diplomacyDelta:     0,
      economyDelta:       opt.economy ?? 0,
      securityDelta:      0,
      coalitionDelta:     opt.coalition ?? 0,
      pmScandalOccurred:  false,
      eventTitle:         `経済政策：${opt.label}`,
      eventDesc:          opt.desc,
      impact: (opt.economy ?? 0) >= 0 ? 'good' : 'neutral',
    }, `${opt.label}を打ち出しました。`);
  }

  // ===== 安全保障 =====
  function handleSecurity(opt: typeof SECURITY_OPTIONS[0]) {
    commit({
      approvalDelta:      opt.approval ?? 0,
      consistencyDelta:   1,
      partyAffinityDelta: 0,
      followersDelta:     opt.followers ?? 0,
      policyScoreDelta:   opt.policy ?? 0,
      diplomacyDelta:     opt.diplomacy ?? 0,
      economyDelta:       opt.economy ?? 0,
      securityDelta:      opt.security ?? 0,
      coalitionDelta:     0,
      pmScandalOccurred:  false,
      eventTitle:         `安全保障：${opt.label}`,
      eventDesc:          opt.desc,
      impact: (opt.security ?? 0) > 0 ? 'good' : 'neutral',
    }, `${opt.label}を決定しました。`);
  }

  // ===== 連立交渉 =====
  function handleCoalition(opt: typeof COALITION_OPTIONS[0]) {
    commit({
      approvalDelta:      opt.approval ?? 0,
      consistencyDelta:   (opt.coalition ?? 0) < 0 ? 2 : -1,
      partyAffinityDelta: opt.partyAffinity ?? 0,
      followersDelta:     opt.followers ?? 0,
      policyScoreDelta:   opt.policy ?? 0,
      diplomacyDelta:     0,
      economyDelta:       0,
      securityDelta:      0,
      coalitionDelta:     opt.coalition ?? 0,
      pmScandalOccurred:  false,
      eventTitle:         `連立交渉：${opt.label}`,
      eventDesc:          opt.desc,
      impact: (opt.coalition ?? 0) >= 0 ? 'good' : 'bad',
    }, `${opt.label}を実施しました。連立安定度：${(opt.coalition ?? 0) >= 0 ? '+' : ''}${opt.coalition ?? 0}`);
  }

  // ===== 記者会見 =====
  function handleMedia(opt: typeof MEDIA_OPTIONS[0]) {
    const risky = (opt as { risky?: boolean }).risky;
    const scandal = risky && Math.random() < 0.30;
    const approvalChange = risky
      ? (scandal ? -6 : 5)
      : (opt.approval ?? 0);
    const followersChange = risky
      ? (scandal ? -200 : 200)
      : (opt.followers ?? 0);
    commit({
      approvalDelta:      approvalChange,
      consistencyDelta:   1,
      partyAffinityDelta: 0,
      followersDelta:     followersChange,
      policyScoreDelta:   opt.policy ?? 0,
      diplomacyDelta:     opt.diplomacy ?? 0,
      economyDelta:       0,
      securityDelta:      0,
      coalitionDelta:     risky ? (scandal ? -1 : 0) : (opt.coalition ?? 0),
      pmScandalOccurred:  !!scandal,
      eventTitle:         scandal ? '総理の発言が炎上した' : `記者会見：${opt.label}`,
      eventDesc:          scandal
        ? '強気の発言が予期せぬ形で批判を浴びた。内閣支持率が急落。'
        : opt.desc,
      impact: scandal ? 'bad' : approvalChange >= 3 ? 'good' : 'neutral',
    }, scandal
      ? '炎上！支持率とフォロワーが大幅に低下しました。'
      : `${opt.label}が完了しました。`);
  }

  // ===== 結果フェーズ =====
  if (phase === 'result' && result) {
    return (
      <div className="pm-result-panel">
        <div className={`pm-result-banner ${result.impact}`}>
          {result.impact === 'good' ? '✅ ' : result.impact === 'bad' ? '⚠️ ' : '📋 '}
          {result.eventTitle}
        </div>
        <div className="pm-feedback">{feedback}</div>
        <div className="pm-deltas">
          {result.approvalDelta      !== 0 && <span className={result.approvalDelta > 0 ? 'pos' : 'neg'}>支持率 {result.approvalDelta > 0 ? '+' : ''}{result.approvalDelta}</span>}
          {result.diplomacyDelta     !== 0 && <span className={result.diplomacyDelta > 0 ? 'pos' : 'neg'}>外交 {result.diplomacyDelta > 0 ? '+' : ''}{result.diplomacyDelta}</span>}
          {result.economyDelta       !== 0 && <span className={result.economyDelta > 0 ? 'pos' : 'neg'}>経済 {result.economyDelta > 0 ? '+' : ''}{result.economyDelta}</span>}
          {result.securityDelta      !== 0 && <span className={result.securityDelta > 0 ? 'pos' : 'neg'}>安保 {result.securityDelta > 0 ? '+' : ''}{result.securityDelta}</span>}
          {result.coalitionDelta     !== 0 && <span className={result.coalitionDelta > 0 ? 'pos' : 'neg'}>連立 {result.coalitionDelta > 0 ? '+' : ''}{result.coalitionDelta}</span>}
          {result.partyAffinityDelta !== 0 && <span className={result.partyAffinityDelta > 0 ? 'pos' : 'neg'}>党親密度 {result.partyAffinityDelta > 0 ? '+' : ''}{result.partyAffinityDelta}</span>}
          {result.followersDelta     !== 0 && <span className={result.followersDelta > 0 ? 'pos' : 'neg'}>F {result.followersDelta > 0 ? '+' : ''}{result.followersDelta}</span>}
          {result.policyScoreDelta    > 0  && <span className="pos">実績 +{result.policyScoreDelta}</span>}
        </div>
        <button className="pm-confirm-btn" onClick={() => onAction(result)}>
          確定してターンを消費する
        </button>
      </div>
    );
  }

  // ===== サブ選択フェーズ =====
  if (phase === 'sub') {
    if (actionType === 'cabinet') return (
      <div className="pm-sub-panel">
        <div className="pm-sub-title">📋 閣議の議題を選んでください</div>
        <div className="pm-sub-btns">
          {CABINET_AGENDAS.map((a, i) => (
            <button key={i} className="pm-sub-btn" onClick={() => handleCabinet(a)}>{a.label}</button>
          ))}
        </div>
        <button className="pm-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'diplomacy') return (
      <div className="pm-sub-panel">
        <div className="pm-sub-title">🌐 外交方針を選んでください</div>
        <div className="pm-sub-btns">
          {DIPLOMACY_OPTIONS.map((o, i) => (
            <button key={i} className="pm-sub-btn" onClick={() => handleDiplomacy(o)}>
              {o.label}<small>{o.desc}</small>
            </button>
          ))}
        </div>
        <button className="pm-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'economy') return (
      <div className="pm-sub-panel">
        <div className="pm-sub-title">💴 経済政策を選んでください</div>
        <div className="pm-sub-btns">
          {ECONOMY_OPTIONS.map((o, i) => (
            <button key={i} className="pm-sub-btn" onClick={() => handleEconomy(o)}>
              {o.label}<small>{o.desc}</small>
            </button>
          ))}
        </div>
        <button className="pm-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'security') return (
      <div className="pm-sub-panel">
        <div className="pm-sub-title">🛡️ 安全保障の方針を選んでください</div>
        <div className="pm-sub-btns">
          {SECURITY_OPTIONS.map((o, i) => (
            <button key={i} className="pm-sub-btn" onClick={() => handleSecurity(o)}>
              {o.label}<small>{o.desc}</small>
            </button>
          ))}
        </div>
        <button className="pm-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'coalition') return (
      <div className="pm-sub-panel">
        <div className="pm-sub-title">🤝 連立交渉の方針を選んでください</div>
        <div className="pm-sub-hint">現在の連立安定度: {coalitionStability}</div>
        <div className="pm-sub-btns">
          {COALITION_OPTIONS.map((o, i) => (
            <button key={i} className="pm-sub-btn" onClick={() => handleCoalition(o)}>
              {o.label}<small>{o.desc}</small>
            </button>
          ))}
        </div>
        <button className="pm-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'media') return (
      <div className="pm-sub-panel">
        <div className="pm-sub-title">🎙️ 会見スタイルを選んでください</div>
        <div className="pm-sub-btns">
          {MEDIA_OPTIONS.map((o, i) => (
            <button key={i} className="pm-sub-btn" onClick={() => handleMedia(o)}>
              {o.label}<small>{o.desc}</small>
            </button>
          ))}
        </div>
        <button className="pm-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );
  }

  // ===== 行動選択フェーズ =====
  return (
    <div className="pm-action-panel">
      <div className="pm-phase-info">
        🏛️ 第{cabinetTerm}次内閣 — ターン {cabinetTurn} / 12
        <span className="pm-score-chip">外交 {diplomacyScore}</span>
        <span className="pm-score-chip">経済 {economyScore}</span>
        <span className="pm-score-chip">安保 {securityScore}</span>
        <span className="pm-coalition-chip">連立 {coalitionStability}</span>
      </div>
      <div className="pm-action-btns">
        <button className="pm-action-btn" onClick={() => { setActionType('cabinet');   setPhase('sub'); }}>
          📋 閣議<small>政策実績と各スコアを着実に積む</small>
        </button>
        <button className="pm-action-btn" onClick={() => { setActionType('diplomacy'); setPhase('sub'); }}>
          🌐 外交<small>国際評価と安保への影響が大きい</small>
        </button>
        <button className="pm-action-btn" onClick={() => { setActionType('economy');   setPhase('sub'); }}>
          💴 経済政策<small>短期支持率と長期経済評価のトレードオフ</small>
        </button>
        <button className="pm-action-btn" onClick={() => { setActionType('security');  setPhase('sub'); }}>
          🛡️ 安全保障<small>防衛・危機管理の強化</small>
        </button>
        <button className="pm-action-btn" onClick={() => { setActionType('coalition'); setPhase('sub'); }}>
          🤝 連立交渉<small>政権維持の生命線（連立{coalitionStability <= 30 ? ' ⚠️危険' : ''}）</small>
        </button>
        <button className="pm-action-btn" onClick={() => { setActionType('media');     setPhase('sub'); }}>
          🎙️ 記者会見<small>支持率とフォロワーに大きく影響</small>
        </button>
      </div>
    </div>
  );
}
