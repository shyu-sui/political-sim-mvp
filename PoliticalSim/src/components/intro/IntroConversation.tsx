import { useState } from 'react';
import type { BeliefScore } from '../../types/gameTypes';
import { defaultBeliefScore } from '../../types/gameTypes';
import './IntroConversation.css';

interface Props {
  playerName: string;
  onComplete: (belief: BeliefScore) => void;
}

type Speaker = 'friend' | 'player' | 'system';

type DialogueLine = {
  id:      string;
  speaker: Speaker;
  name?:   string;
  text:    string;
};

type ChoiceStep = {
  id:      string;
  prompt:  string;
  choices: {
    label:  string;
    apply:  (b: BeliefScore) => BeliefScore;
    next:   string; // next step id
  }[];
};

type Step =
  | { kind: 'dialogue'; lines: DialogueLine[]; next: string }
  | { kind: 'choice';   data: ChoiceStep }
  | { kind: 'end' };

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }

const STEPS: Record<string, Step> = {
  s0: {
    kind: 'dialogue',
    lines: [
      { id: 'l0a', speaker: 'system', text: '選挙告示1週間前。架空の国「アルメリア共和国」' },
      { id: 'l0b', speaker: 'friend', name: '山田', text: 'ねえ、来週から選挙の告示なんだって。知ってた？' },
    ],
    next: 's1',
  },
  s1: {
    kind: 'choice',
    data: {
      id: 'c1',
      prompt: '山田に答える',
      choices: [
        { label: '全然知らなかった', apply: b => ({ ...b, consistency: clamp(b.consistency - 0) }), next: 's2' },
        { label: 'なんとなく知ってた', apply: b => b, next: 's2' },
        { label: 'もちろん知ってる',  apply: b => ({ ...b, consistency: clamp(b.consistency + 2) }), next: 's2' },
      ],
    },
  },
  s2: {
    kind: 'dialogue',
    lines: [
      { id: 'l2a', speaker: 'friend', name: '山田', text: 'そうなんだよ。アルメリアの経済、ここ数年ずっと停滞してるじゃん？どう思う？' },
    ],
    next: 's3',
  },
  s3: {
    kind: 'choice',
    data: {
      id: 'c3',
      prompt: '経済政策についての考え',
      choices: [
        {
          label: '規制を緩和して民間に任せるべき',
          apply: b => ({ ...b, economy: clamp(b.economy + 20), consistency: clamp(b.consistency + 3) }),
          next: 's4a',
        },
        {
          label: '政府がもっと積極的に投資すべき',
          apply: b => ({ ...b, welfare: clamp(b.welfare + 20), consistency: clamp(b.consistency + 3) }),
          next: 's4b',
        },
        {
          label: 'どちらとも言えない',
          apply: b => b,
          next: 's4c',
        },
      ],
    },
  },
  s4a: {
    kind: 'dialogue',
    lines: [
      { id: 'l4a', speaker: 'friend', name: '山田', text: 'なるほど、市場に任せる派か。じゃあ、隣のオルメン帝国との関係が緊張してるって話、どう思う？' },
    ],
    next: 's5',
  },
  s4b: {
    kind: 'dialogue',
    lines: [
      { id: 'l4b', speaker: 'friend', name: '山田', text: '積極財政ね。じゃあ、隣のオルメン帝国との緊張関係についてはどう考える？' },
    ],
    next: 's5',
  },
  s4c: {
    kind: 'dialogue',
    lines: [
      { id: 'l4c', speaker: 'friend', name: '山田', text: 'そっかー。ところでさ、オルメン帝国との関係が緊張してるって聞いたんだけど、心配じゃない？' },
    ],
    next: 's5',
  },
  s5: {
    kind: 'choice',
    data: {
      id: 'c5',
      prompt: '安全保障・外交についての考え',
      choices: [
        {
          label: '強い防衛力で抑止するべき',
          apply: b => ({ ...b, security: clamp(b.security + 20), consistency: clamp(b.consistency + 3) }),
          next: 's6',
        },
        {
          label: '対話と外交で解決すべき',
          apply: b => ({ ...b, foreign: clamp(b.foreign + 20), security: clamp(b.security - 5), consistency: clamp(b.consistency + 3) }),
          next: 's6',
        },
        {
          label: 'アルメリアが介入する話じゃない',
          apply: b => b,
          next: 's6',
        },
      ],
    },
  },
  s6: {
    kind: 'dialogue',
    lines: [
      { id: 'l6a', speaker: 'friend', name: '山田', text: 'ふーん、あなたってそういう考え方なんだね。もしかして政治、興味ある？' },
    ],
    next: 's7',
  },
  s7: {
    kind: 'choice',
    data: {
      id: 'c7',
      prompt: '政治への関心',
      choices: [
        {
          label: 'ちょっと興味出てきた',
          apply: b => ({ ...b, consistency: clamp(b.consistency + 5) }),
          next: 's8a',
        },
        {
          label: '正直、自分には関係ないかな',
          apply: b => ({ ...b, consistency: clamp(b.consistency - 5) }),
          next: 's8b',
        },
      ],
    },
  },
  s8a: {
    kind: 'dialogue',
    lines: [
      { id: 'l8a1', speaker: 'friend', name: '山田', text: 'いいじゃん！選挙まであと1週間。あなたの行動が世論を動かすかもよ。' },
      { id: 'l8a2', speaker: 'system', text: '信念スコアが初期化されました。さあ、選挙の1週間前が始まります。' },
    ],
    next: 'end',
  },
  s8b: {
    kind: 'dialogue',
    lines: [
      { id: 'l8b1', speaker: 'friend', name: '山田', text: 'そっか…でもせめて選挙くらい行こうよ。あなたの一票が変えるかもしれないんだから。' },
      { id: 'l8b2', speaker: 'system', text: '政治への関心は低いまま。でも時代の流れはあなたを巻き込んでいく……' },
    ],
    next: 'end',
  },
  end: { kind: 'end' },
};

export default function IntroConversation({ playerName, onComplete }: Props) {
  const [stepId, setStepId] = useState<string>('s0');
  const [belief, setBelief] = useState<BeliefScore>(defaultBeliefScore());
  const [lineIdx, setLineIdx] = useState<number>(0);

  const step = STEPS[stepId];

  function advanceLine() {
    if (step.kind !== 'dialogue') return;
    const next = lineIdx + 1;
    if (next < step.lines.length) {
      setLineIdx(next);
    } else {
      setStepId(step.next);
      setLineIdx(0);
    }
  }

  function choose(idx: number) {
    if (step.kind !== 'choice') return;
    const ch = step.data.choices[idx];
    setBelief(prev => ch.apply(prev));
    setStepId(ch.next);
    setLineIdx(0);
  }

  function finish() {
    onComplete(belief);
  }

  // --- end step ---
  if (step.kind === 'end') {
    return (
      <div className="ic-overlay">
        <div className="ic-panel">
          <div className="ic-belief-summary">
            <div className="ic-bs-title">📊 信念スコア（初期値）</div>
            <div className="ic-bs-rows">
              {([
                ['経済（市場重視↑）', belief.economy],
                ['福祉（大きな政府↑）', belief.welfare],
                ['安全保障（タカ派↑）', belief.security],
                ['環境', belief.environment],
                ['外交（グローバル↑）', belief.foreign],
                ['一貫性', belief.consistency],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} className="ic-bs-row">
                  <span className="ic-bs-label">{label}</span>
                  <div className="ic-bs-bar">
                    <div className="ic-bs-fill" style={{ width: `${val}%` }} />
                  </div>
                  <span className="ic-bs-val">{Math.round(val)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="ic-hint">この信念に基づいて、あなたの政治行動が評価されます。</p>
          <button className="ic-btn-start" onClick={finish}>
            ゲームスタート →
          </button>
        </div>
      </div>
    );
  }

  // --- dialogue step ---
  if (step.kind === 'dialogue') {
    const line = step.lines[lineIdx];
    const isSystem = line.speaker === 'system';
    const isFriend = line.speaker === 'friend';
    return (
      <div className="ic-overlay" onClick={advanceLine}>
        <div className="ic-panel">
          <div className="ic-scene">
            {isSystem ? (
              <div className="ic-system-msg">{line.text}</div>
            ) : isFriend ? (
              <div className="ic-bubble ic-bubble-left">
                <div className="ic-avatar ic-avatar-friend">{line.name?.charAt(0) ?? '?'}</div>
                <div className="ic-cloud ic-cloud-left">
                  <span className="ic-speaker-name">{line.name}</span>
                  <p>{line.text}</p>
                </div>
              </div>
            ) : (
              <div className="ic-bubble ic-bubble-right">
                <div className="ic-cloud ic-cloud-right">
                  <span className="ic-speaker-name">{playerName || 'あなた'}</span>
                  <p>{line.text}</p>
                </div>
                <div className="ic-avatar ic-avatar-player">{(playerName || 'あ').charAt(0)}</div>
              </div>
            )}
          </div>
          <div className="ic-tap-hint">タップして次へ</div>
          <div className="ic-progress">
            {step.lines.map((_, i) => (
              <span key={i} className={`ic-prog-dot${i <= lineIdx ? ' done' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- choice step ---
  const choiceData = step.data;
  return (
    <div className="ic-overlay">
      <div className="ic-panel">
        <div className="ic-choice-prompt">{choiceData.prompt}</div>
        <div className="ic-choices">
          {choiceData.choices.map((ch, i) => (
            <button key={i} className="ic-choice-btn" onClick={() => choose(i)}>
              {ch.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
