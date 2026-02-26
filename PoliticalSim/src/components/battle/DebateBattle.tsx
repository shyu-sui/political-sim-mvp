import { useState, useEffect } from 'react';
import type { DebateState, DebateSkill, DebateLogEntry } from '../../types/gameTypes';
import './DebateBattle.css';

interface Props {
  state:      DebateState;
  onClose:    (result: { result: 'win' | 'lose'; consistencyDelta: number }) => void;
}

type SkillDef = {
  id:         DebateSkill;
  label:      string;
  desc:       string;
  icon:       string;
  baseDamage: [number, number]; // [min, max]
  selfRisk:   number;           // consistency delta (negative = risk)
  cost:       number;           // future: AP or cooldown
};

const SKILLS: SkillDef[] = [
  {
    id: 'logic_attack',
    label: 'ロジックアタック',
    icon: '🔎',
    desc: '論理的根拠で相手の主張を崩す。一貫性が高いほど効果的。',
    baseDamage: [15, 25],
    selfRisk: 0,
    cost: 0,
  },
  {
    id: 'data_shield',
    label: 'データシールド',
    icon: '🛡️',
    desc: '統計データで自説を守る。次の攻撃ダメージを半減させる。',
    baseDamage: [5, 10],
    selfRisk: +3,   // consistency UP
    cost: 0,
  },
  {
    id: 'emotional_appeal',
    label: '感情訴求',
    icon: '❤️',
    desc: '聴衆の感情に訴える。ダメージ高めだが一貫性がやや下がる。',
    baseDamage: [20, 30],
    selfRisk: -3,
    cost: 0,
  },
  {
    id: 'nitpick',
    label: '揚げ足取り',
    icon: '⚡',
    desc: '相手の言葉尻を捉えて攻撃。ハイリスク・ハイリターン。',
    baseDamage: [25, 35],
    selfRisk: -10,
    cost: 0,
  },
];

const OPPONENT_SKILLS: DebateSkill[] = ['logic_attack', 'data_shield', 'emotional_appeal', 'nitpick'];

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function skillLabel(s: DebateSkill) {
  return SKILLS.find(x => x.id === s)?.label ?? s;
}

function opponentAI(state: DebateState): DebateSkill {
  // 相手HPが低いなら守りに入る
  if (state.opponentHP < 30) return 'data_shield';
  // プレイヤーHPが低いなら攻め込む
  if (state.playerHP < 30) return 'nitpick';
  // ランダム（ロジック多め）
  const weights: [DebateSkill, number][] = [
    ['logic_attack',     4],
    ['data_shield',      2],
    ['emotional_appeal', 2],
    ['nitpick',          1],
  ];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [skill, w] of weights) {
    r -= w;
    if (r <= 0) return skill;
  }
  return 'logic_attack';
}

function opponentLine(skill: DebateSkill, damage: number): string {
  const lines: Record<DebateSkill, string[]> = {
    logic_attack:     [`「その根拠は？データを見れば明らかです。」(${damage}ダメージ)`, `「論理的に考えれば答えは一つ。」(${damage}ダメージ)`],
    data_shield:      [`「最新の統計によると…」(${damage}ダメージ)`, `「ファクトで反論します。」(${damage}ダメージ)`],
    emotional_appeal: [`「国民の声を聞いてください！」(${damage}ダメージ)`, `「子どもたちの未来のために。」(${damage}ダメージ)`],
    nitpick:          [`「今さっき矛盾したことを言いましたよ！」(${damage}ダメージ)`, `「言葉を切り取らせてもらいます。」(${damage}ダメージ)`],
  };
  const opts = lines[skill];
  return opts[Math.floor(Math.random() * opts.length)];
}

function playerLine(skill: DebateSkill, damage: number): string {
  const lines: Record<DebateSkill, string[]> = {
    logic_attack:     [`「データが示す通り、この政策は有効です。」(${damage}ダメージ)`, `「論点を整理しましょう。」(${damage}ダメージ)`],
    data_shield:      [`「統計的根拠をもとに申し上げます。」(${damage}ダメージ)`, `「エビデンスがあります。」(${damage}ダメージ)`],
    emotional_appeal: [`「市民の皆さん、聞いてください！」(${damage}ダメージ)`, `「未来のために声を上げます。」(${damage}ダメージ)`],
    nitpick:          [`「今の発言、矛盾していませんか？」(${damage}ダメージ)`, `「その主張には穴があります。」(${damage}ダメージ)`],
  };
  const opts = lines[skill];
  return opts[Math.floor(Math.random() * opts.length)];
}

export default function DebateBattle({ state: initState, onClose }: Props) {
  const [st, setSt]    = useState<DebateState>(initState);
  const [cDelta, setCDelta] = useState(0); // 一貫性スコア累計変化
  const [animating, setAnimating] = useState(false);

  // 相手ターンの自動処理
  useEffect(() => {
    if (st.turn !== 'opponent' || st.result) return;
    const timer = setTimeout(() => {
      const skill  = opponentAI(st);
      const def    = SKILLS.find(s => s.id === skill)!;
      const rawDmg = randInt(def.baseDamage[0], def.baseDamage[1]);
      // シールド中なら半減
      const dmg    = st.shielded ? Math.max(1, Math.floor(rawDmg / 2)) : rawDmg;
      const msg    = opponentLine(skill, dmg);

      setSt(prev => {
        const newPlayerHP  = Math.max(0, prev.playerHP - dmg);
        const log: DebateLogEntry = { actor: 'opponent', skill, message: msg, damage: dmg };
        const result: 'win' | 'lose' | undefined =
          newPlayerHP <= 0 ? 'lose' :
          prev.opponentHP <= 0 ? 'win' : undefined;
        return {
          ...prev,
          playerHP: newPlayerHP,
          shielded: false,
          turn: result ? 'done' : 'player',
          log: [log, ...prev.log],
          result,
        };
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [st.turn, st.result]);

  function useSkill(skill: DebateSkill) {
    if (st.turn !== 'player' || st.result || animating) return;
    setAnimating(true);
    const def    = SKILLS.find(s => s.id === skill)!;
    const rawDmg = randInt(def.baseDamage[0], def.baseDamage[1]);
    const dmg    = rawDmg; // no shield for player for simplicity
    const msg    = playerLine(skill, dmg);
    const cChange = def.selfRisk;

    setCDelta(prev => prev + cChange);

    setSt(prev => {
      const newOppHP = Math.max(0, prev.opponentHP - dmg);
      const shielded = skill === 'data_shield';
      const log: DebateLogEntry = { actor: 'player', skill, message: msg, damage: dmg };
      const result: 'win' | 'lose' | undefined =
        newOppHP <= 0 ? 'win' :
        prev.playerHP <= 0 ? 'lose' : undefined;
      return {
        ...prev,
        opponentHP: newOppHP,
        shielded,
        turn: result ? 'done' : 'opponent',
        log: [log, ...prev.log],
        result,
      };
    });
    setTimeout(() => setAnimating(false), 300);
  }

  function hpColor(hp: number, max: number) {
    const pct = hp / max;
    if (pct > 0.5) return '#22c55e';
    if (pct > 0.25) return '#f59e0b';
    return '#ef4444';
  }

  function hpPct(hp: number, max: number) {
    return Math.max(0, Math.min(100, (hp / max) * 100));
  }

  const isDone = !!st.result;

  return (
    <div className="db-overlay">
      <div className="db-panel">
        {/* ヘッダー */}
        <div className="db-header">
          <span className="db-tag">討論バトル</span>
          <span className="db-topic">{st.topic}</span>
        </div>

        {/* HP エリア */}
        <div className="db-hp-area">
          {/* プレイヤー */}
          <div className="db-fighter db-player">
            <div className="db-fighter-name">あなた</div>
            <div className="db-hp-bar-wrap">
              <div
                className="db-hp-bar-fill"
                style={{
                  width: `${hpPct(st.playerHP, st.maxHP)}%`,
                  background: hpColor(st.playerHP, st.maxHP),
                }}
              />
            </div>
            <div className="db-hp-num">{st.playerHP} / {st.maxHP}</div>
            {st.shielded && <div className="db-shield-badge">🛡️ シールド</div>}
          </div>

          <div className="db-vs">VS</div>

          {/* 相手 */}
          <div className="db-fighter db-opponent">
            <div className="db-fighter-name">{st.opponentName}</div>
            <div className="db-fighter-party">{st.opponentParty}</div>
            <div className="db-hp-bar-wrap">
              <div
                className="db-hp-bar-fill"
                style={{
                  width: `${hpPct(st.opponentHP, st.maxHP)}%`,
                  background: hpColor(st.opponentHP, st.maxHP),
                }}
              />
            </div>
            <div className="db-hp-num">{st.opponentHP} / {st.maxHP}</div>
          </div>
        </div>

        {/* ターン表示 */}
        {!isDone && (
          <div className={`db-turn-banner${st.turn === 'opponent' ? ' db-turn-opp' : ''}`}>
            {st.turn === 'player' ? '⚔️ あなたのターン' : '⏳ 相手が考えています…'}
          </div>
        )}

        {/* 結果バナー */}
        {isDone && (
          <div className={`db-result-banner${st.result === 'win' ? ' win' : ' lose'}`}>
            {st.result === 'win' ? '🎉 討論勝利！' : '😔 討論敗北…'}
            <button
              className="db-close-btn"
              onClick={() => onClose({ result: st.result!, consistencyDelta: cDelta })}
            >
              閉じる
            </button>
          </div>
        )}

        {/* スキルボタン */}
        {!isDone && (
          <div className="db-skills">
            {SKILLS.map(sk => (
              <button
                key={sk.id}
                className={`db-skill-btn${st.turn !== 'player' ? ' disabled' : ''}`}
                onClick={() => useSkill(sk.id)}
                disabled={st.turn !== 'player' || animating}
                title={sk.desc}
              >
                <span className="db-sk-icon">{sk.icon}</span>
                <span className="db-sk-label">{sk.label}</span>
                <span className="db-sk-risk" style={{ color: sk.selfRisk < 0 ? '#ef4444' : '#22c55e' }}>
                  {sk.selfRisk < 0 ? `一貫性${sk.selfRisk}` : sk.selfRisk > 0 ? `一貫性+${sk.selfRisk}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 戦闘ログ */}
        <div className="db-log">
          {st.log.slice(0, 6).map((entry, i) => (
            <div
              key={i}
              className={`db-log-line${entry.actor === 'player' ? ' player' : ' opponent'}`}
            >
              <span className="db-log-actor">
                {entry.actor === 'player' ? 'あなた' : st.opponentName}
              </span>
              <span className="db-log-skill">[{skillLabel(entry.skill)}]</span>
              <span className="db-log-msg">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ファクトリー: 討論バトル開始時の初期状態を生成
export function createDebateState(params: {
  opponentName:  string;
  opponentParty: string;
  topic:         string;
  opponentHP?:   number;
}): DebateState {
  return {
    active:        true,
    opponentName:  params.opponentName,
    opponentParty: params.opponentParty,
    topic:         params.topic,
    playerHP:      100,
    opponentHP:    params.opponentHP ?? 80,
    maxHP:         100,
    shielded:      false,
    turn:          'player',
    log:           [],
  };
}

// 未使用変数警告を避けるためエクスポート
export { OPPONENT_SKILLS };
