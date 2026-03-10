import { useState } from 'react';
import type { Party } from '../../types/gameTypes';
import { getPartyById } from '../config/parties';
import './national.css';

export interface NmpActionResult {
  approvalDelta:      number;
  consistencyDelta:   number;
  partyAffinityDelta: number;
  followersDelta:     number;
  policyScoreDelta:   number;
  scandalOccurred:    boolean;
  eventTitle:         string;
  eventDesc:          string;
  impact:             'good' | 'bad' | 'neutral';
}

interface Props {
  playerPartyId: string;
  partyAffinity: number;
  policyScore:   number;
  approvalRate:  number;
  consistency:   number;
  nationalTerm:  number;
  nationalTurn:  number;
  onAction:      (result: NmpActionResult) => void;
}

type ActionType = 'committee' | 'debate' | 'policy' | 'party' | 'media';
type Phase = 'select' | 'sub' | 'result';

/** 党の beliefs から上位2カテゴリを返す */
function getPartyFocus(party: Party): string[] {
  const b = party.beliefs;
  const scored: [string, number][] = [
    ['economy', b.economy], ['welfare', b.welfare],
    ['security', b.security], ['environment', b.environment], ['foreign', b.foreign],
  ];
  return scored.sort((a, z) => z[1] - a[1]).slice(0, 2).map(s => s[0]);
}

const COMMITTEE_FOCUS: Record<string, string> = {
  '経済委員会':     'economy',
  '外交委員会':     'foreign',
  '環境委員会':     'environment',
  '社会保障委員会': 'welfare',
  '科学技術委員会': 'economy',
  '地方自治委員会': 'welfare',
};

const DEBATE_STANCES = [
  { label: '安全保障強化を主張',     category: 'security' },
  { label: '財政拡大・景気対策を訴える', category: 'economy' },
  { label: '脱炭素・再エネを訴える',  category: 'environment' },
  { label: '福祉・医療充実を訴える',  category: 'welfare' },
  { label: '規制緩和・成長優先',      category: 'economy' },
  { label: '外交重視・国際協調',      category: 'foreign' },
];

const POLICY_OPTIONS = [
  { label: '子育て支援強化',  category: 'welfare',     desc: '保育所の充実と育児休業給付を拡充する法案。' },
  { label: '地域産業振興',    category: 'economy',     desc: '地方の中小企業支援と観光振興を推進する法案。' },
  { label: '再エネ推進',      category: 'environment', desc: '再生可能エネルギー設備への補助と普及促進。' },
  { label: '規制緩和',        category: 'economy',     desc: '経済活動を阻む規制を見直し、民間活力を引き出す。' },
  { label: '教育改革',        category: 'welfare',     desc: '授業料無償化と教育DXで格差解消を目指す。' },
  { label: '医療制度改善',    category: 'welfare',     desc: '地域医療の充実と医師偏在の解消を図る。' },
  { label: '安全保障強化',    category: 'security',    desc: '防衛力整備と同盟国との連携強化を推進する。' },
  { label: '外交関係強化',    category: 'foreign',     desc: '近隣諸国との対話促進と経済連携協定の締結。' },
];

const MEDIA_STYLES = [
  { label: '無難な発言',     desc: '波風を立てない安定路線。変動は小さい。' },
  { label: '攻めた発言',     desc: 'インパクトは大きいがスキャンダルリスクあり。' },
  { label: '党方針に忠実',   desc: '党への貢献を強調。一貫性は下がりやすい。' },
  { label: '市民目線を強調', desc: '有権者への共感を前面に。支持率が上がりやすい。' },
];

export default function NationalMpActions({
  playerPartyId, partyAffinity, policyScore,
  approvalRate, consistency, nationalTerm, nationalTurn, onAction,
}: Props) {
  const [phase,      setPhase]      = useState<Phase>('select');
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [result,     setResult]     = useState<NmpActionResult | null>(null);
  const [feedback,   setFeedback]   = useState('');

  const party      = getPartyById(playerPartyId);
  const partyFocus = party ? getPartyFocus(party) : [];

  function commit(res: NmpActionResult, fb: string) {
    setResult(res);
    setFeedback(fb);
    setPhase('result');
  }

  // ===== 委員会 =====
  function handleCommittee(name: string) {
    const isMatch = partyFocus.includes(COMMITTEE_FOCUS[name] ?? '');
    commit({
      approvalDelta:      isMatch ? 2 : 1,
      consistencyDelta:   isMatch ? 2 : 1,
      partyAffinityDelta: isMatch ? 5 : 0,
      followersDelta:     0,
      policyScoreDelta:   isMatch ? 2 : 1,
      scandalOccurred:    false,
      eventTitle:         `${name}で質疑に参加した`,
      eventDesc:          isMatch
        ? `${party?.name ?? '所属政党'}の重点分野として熱心に取り組んだ。党内評価も上昇。`
        : '丁寧に委員会業務をこなした。地道な実績が積み重なる。',
      impact: 'good',
    }, isMatch
      ? `${party?.shortName ?? '党'}の重点政策と一致！党内評価が高まりました。`
      : '委員会での活動が記録されました。');
  }

  // ===== 国会討論 =====
  function handleDebate(stance: typeof DEBATE_STANCES[0]) {
    const isAlign = partyFocus.includes(stance.category);
    commit({
      approvalDelta:      isAlign ? 3 : -1,
      consistencyDelta:   2,
      partyAffinityDelta: isAlign ? 6 : -4,
      followersDelta:     isAlign ? 100 : 50,
      policyScoreDelta:   isAlign ? 2 : 0,
      scandalOccurred:    false,
      eventTitle:         `国会討論で「${stance.label}」`,
      eventDesc:          isAlign
        ? `${party?.name ?? '党'}の方針と合致した力強い発言で、党内外から評価を受けた。`
        : '党の方針とは異なる立場を取ったが、信念を貫いた。一部の市民から評価される。',
      impact: isAlign ? 'good' : 'neutral',
    }, isAlign
      ? '党方針と一致した主張で党内評価が急上昇！'
      : '党の方針に反しましたが、一貫性が増しました。');
  }

  // ===== 政策立案 =====
  function handlePolicy(opt: typeof POLICY_OPTIONS[0]) {
    const isAlign = partyFocus.includes(opt.category);
    const successProb = Math.min(0.85, Math.max(0.15,
      (isAlign ? 0.25 : 0) +
      (partyAffinity / 100) * 0.30 +
      (consistency   / 100) * 0.20 +
      (approvalRate  / 100) * 0.20,
    ));
    const success = Math.random() < successProb;
    commit({
      approvalDelta:      success ? 4 : -2,
      consistencyDelta:   success ? 2 : 0,
      partyAffinityDelta: success ? 3 : -1,
      followersDelta:     success ? 200 : 0,
      policyScoreDelta:   success ? 10 : 0,
      scandalOccurred:    false,
      eventTitle:         success ? `「${opt.label}」政策が成立した！` : `「${opt.label}」政策は見送られた`,
      eventDesc:          success
        ? opt.desc + ' 法案が可決成立。政策実績ポイント獲得。'
        : opt.desc + ` 審議の結果、今国会での成立は見送り。（成功確率 ${Math.floor(successProb * 100)}%）`,
      impact: success ? 'good' : 'bad',
    }, success
      ? `政策立案成功！実績+10（成功確率 ${Math.floor(successProb * 100)}%）`
      : `政策は成立しませんでした（成功確率 ${Math.floor(successProb * 100)}%）`);
  }

  // ===== 党内交渉 =====
  function handlePartyNeg(follow: boolean) {
    commit({
      approvalDelta:      follow ? -1 : 2,
      consistencyDelta:   follow ? -3 : 3,
      partyAffinityDelta: follow ? 8 : -5,
      followersDelta:     follow ? 0 : 50,
      policyScoreDelta:   0,
      scandalOccurred:    false,
      eventTitle:         follow ? '党の方針に従い、党内会合で協調した' : '党内会合で自分の意見を主張した',
      eventDesc:          follow
        ? '党執行部の方針を全面支持。次回の法案審議では党のバックアップが期待できる。'
        : '党幹部とは意見が対立したが、筋を通した。市民からの信頼は上昇。',
      impact: 'neutral',
    }, follow
      ? '党との関係が深まりました（一貫性は下がりました）。'
      : '信念を貫きました！一貫性が上昇し、市民からの支持も微増。');
  }

  // ===== メディア対応 =====
  function handleMedia(style: typeof MEDIA_STYLES[0]) {
    const isAggressive  = style.label === '攻めた発言';
    const isPartyLine   = style.label === '党方針に忠実';
    const isCitizenView = style.label === '市民目線を強調';
    const scandal       = isAggressive && Math.random() < 0.25;
    const follDelta     = scandal ? -200 : isAggressive ? 300 : isCitizenView ? 150 : isPartyLine ? 50 : 80;
    commit({
      approvalDelta:      scandal ? -6 : isCitizenView ? 3 : isAggressive ? 2 : 1,
      consistencyDelta:   isPartyLine ? -2 : 1,
      partyAffinityDelta: isPartyLine ? 4 : isAggressive ? -2 : isCitizenView ? -1 : 0,
      followersDelta:     follDelta,
      policyScoreDelta:   0,
      scandalOccurred:    scandal,
      eventTitle:         scandal ? '発言が炎上した' : `メディア対応：${style.label}`,
      eventDesc:          scandal
        ? '攻めた発言が予想外の反発を呼んだ。支持率とフォロワーが大幅減少。'
        : style.desc,
      impact: scandal ? 'bad' : isCitizenView || isAggressive ? 'good' : 'neutral',
    }, scandal
      ? '炎上！発言が批判を集めてしまいました。'
      : `メディア対応が完了しました（フォロワー${follDelta >= 0 ? '+' : ''}${follDelta}）`);
  }

  // ===== 結果フェーズ =====
  if (phase === 'result' && result) {
    return (
      <div className="nmp-result-panel">
        <div className={`nmp-result-banner ${result.impact}`}>
          {result.impact === 'good' ? '✅ ' : result.impact === 'bad' ? '⚠️ ' : '📋 '}
          {result.eventTitle}
        </div>
        <div className="nmp-feedback">{feedback}</div>
        <div className="nmp-deltas">
          {result.approvalDelta      !== 0 && <span className={result.approvalDelta > 0 ? 'pos' : 'neg'}>支持率 {result.approvalDelta > 0 ? '+' : ''}{result.approvalDelta}</span>}
          {result.consistencyDelta   !== 0 && <span className={result.consistencyDelta > 0 ? 'pos' : 'neg'}>一貫性 {result.consistencyDelta > 0 ? '+' : ''}{result.consistencyDelta}</span>}
          {result.partyAffinityDelta !== 0 && <span className={result.partyAffinityDelta > 0 ? 'pos' : 'neg'}>党親密度 {result.partyAffinityDelta > 0 ? '+' : ''}{result.partyAffinityDelta}</span>}
          {result.followersDelta     !== 0 && <span className={result.followersDelta > 0 ? 'pos' : 'neg'}>F {result.followersDelta > 0 ? '+' : ''}{result.followersDelta}</span>}
          {result.policyScoreDelta    > 0  && <span className="pos">実績 +{result.policyScoreDelta}</span>}
        </div>
        <button className="nmp-confirm-btn" onClick={() => onAction(result)}>
          確定してターンを消費する
        </button>
      </div>
    );
  }

  // ===== サブ選択フェーズ =====
  if (phase === 'sub') {
    if (actionType === 'committee') return (
      <div className="nmp-sub-panel">
        <div className="nmp-sub-title">📋 委員会を選んでください</div>
        <div className="nmp-sub-btns">
          {Object.keys(COMMITTEE_FOCUS).map(name => (
            <button key={name} className="nmp-sub-btn" onClick={() => handleCommittee(name)}>
              {name}
              {partyFocus.includes(COMMITTEE_FOCUS[name]) && <span className="nmp-match">★ 党重点</span>}
            </button>
          ))}
        </div>
        <button className="nmp-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'debate') return (
      <div className="nmp-sub-panel">
        <div className="nmp-sub-title">🎤 どのテーマで主張しますか？</div>
        <div className="nmp-sub-btns">
          {DEBATE_STANCES.map((s, i) => (
            <button key={i} className="nmp-sub-btn" onClick={() => handleDebate(s)}>
              {s.label}
              {partyFocus.includes(s.category) && <span className="nmp-match">★ 党方針</span>}
            </button>
          ))}
        </div>
        <button className="nmp-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'policy') return (
      <div className="nmp-sub-panel">
        <div className="nmp-sub-title">📜 推進する政策を選んでください</div>
        <div className="nmp-sub-hint">成功確率：党親密度・一貫性・支持率・党方針一致で変動</div>
        <div className="nmp-sub-btns">
          {POLICY_OPTIONS.map((p, i) => (
            <button key={i} className="nmp-sub-btn" onClick={() => handlePolicy(p)}>
              {p.label}
              {partyFocus.includes(p.category) && <span className="nmp-match">★ 党重点</span>}
              <small>{p.desc}</small>
            </button>
          ))}
        </div>
        <button className="nmp-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'party') return (
      <div className="nmp-sub-panel">
        <div className="nmp-sub-title">🤝 党内会合でどう振る舞いますか？</div>
        <div className="nmp-sub-btns">
          <button className="nmp-sub-btn" onClick={() => handlePartyNeg(true)}>
            党の方針に従う
            <small>党親密度↑ 一貫性↓ 支持率微減</small>
          </button>
          <button className="nmp-sub-btn" onClick={() => handlePartyNeg(false)}>
            自分の意見を主張する
            <small>一貫性↑ 党親密度↓ 支持率微増</small>
          </button>
        </div>
        <button className="nmp-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );

    if (actionType === 'media') return (
      <div className="nmp-sub-panel">
        <div className="nmp-sub-title">📡 発言スタイルを選んでください</div>
        <div className="nmp-sub-btns">
          {MEDIA_STYLES.map((s, i) => (
            <button key={i} className="nmp-sub-btn" onClick={() => handleMedia(s)}>
              {s.label}
              <small>{s.desc}</small>
            </button>
          ))}
        </div>
        <button className="nmp-back-btn" onClick={() => setPhase('select')}>← 戻る</button>
      </div>
    );
  }

  // ===== 行動選択フェーズ =====
  return (
    <div className="nmp-action-panel">
      <div className="nmp-phase-info">
        🏛️ 第{nationalTerm}期 — ターン {nationalTurn} / 12
        <span className="nmp-policy-chip">実績 {policyScore}pt</span>
        <span className="nmp-affinity-chip">
          党親密度 {partyAffinity} /{party?.shortName ?? '無所属'}
        </span>
      </div>
      <div className="nmp-action-btns">
        <button className="nmp-action-btn" onClick={() => { setActionType('committee'); setPhase('sub'); }}>
          📋 委員会<small>実績・信頼を地道に積む</small>
        </button>
        <button className="nmp-action-btn" onClick={() => { setActionType('debate'); setPhase('sub'); }}>
          🎤 国会討論<small>支持率と党方針に大きく影響</small>
        </button>
        <button className="nmp-action-btn" onClick={() => { setActionType('policy'); setPhase('sub'); }}>
          📜 政策立案<small>成立すれば実績大幅増</small>
        </button>
        <button className="nmp-action-btn" onClick={() => { setActionType('party'); setPhase('sub'); }}>
          🤝 党内交渉<small>党親密度 vs 一貫性のトレードオフ</small>
        </button>
        <button className="nmp-action-btn" onClick={() => { setActionType('media'); setPhase('sub'); }}>
          📡 メディア対応<small>フォロワー・支持率に影響、炎上リスクあり</small>
        </button>
      </div>
    </div>
  );
}
