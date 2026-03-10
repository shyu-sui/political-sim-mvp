import './national.css';

export type EndingType = 'legend' | 'pragmatist' | 'disgraced' | 'shortlived';

const ENDING_DATA: Record<EndingType, { icon: string; title: string; desc: string }> = {
  legend: {
    icon: '🏛️',
    title: '歴史に名を残す国会議員エンド',
    desc: '高い政策実績と国民の支持を背景に、あなたは時代を動かした政治家として歴史に名を刻んだ。数々の立法実績が後世に受け継がれる。',
  },
  pragmatist: {
    icon: '🤝',
    title: '党内で影響力を持つ実務派エンド',
    desc: '派手な改革こそなかったが、党内の信頼を積み重ね、政策を着実に推し進めた実務家として評価された。あなたの築いた人脈は政界に生き続ける。',
  },
  disgraced: {
    icon: '📉',
    title: '信頼を失った国会議員エンド',
    desc: '度重なるスキャンダルと支持率の低迷が響き、政界での信頼を大きく損なった。政治の厳しさを身をもって知ることとなった。',
  },
  shortlived: {
    icon: '⚡',
    title: '短命な国会議員エンド',
    desc: '国政の舞台を踏んだものの、再選を果たせず議員生活を終えた。しかし、その経験はあなたの人生を大きく変えた。',
  },
};

export function calcEnding(
  policyScore:   number,
  approvalRate:  number,
  partyAffinity: number,
  scandalCount:  number,
  term:          number,
): EndingType {
  if (term <= 1)                                    return 'shortlived';
  if (scandalCount >= 3 && approvalRate < 35)       return 'disgraced';
  if (policyScore >= 30 && approvalRate >= 50)      return 'legend';
  if (partyAffinity >= 65)                          return 'pragmatist';
  return 'shortlived';
}

interface Props {
  endingType:      EndingType;
  policyScore:     number;
  nationalTerm:    number;
  onReturnToTitle: () => void;
}

export default function NationalEndingModal({ endingType, policyScore, nationalTerm, onReturnToTitle }: Props) {
  const data = ENDING_DATA[endingType];
  return (
    <div className="nend-overlay">
      <div className="nend-panel">
        <div className="nend-icon">{data.icon}</div>
        <h2 className="nend-title">{data.title}</h2>
        <p className="nend-desc">{data.desc}</p>
        <div className="nend-stats">
          <span>通算 {nationalTerm} 期</span>
          <span>政策実績 {policyScore}pt</span>
        </div>
        <button className="nend-btn" onClick={onReturnToTitle}>タイトルに戻る</button>
      </div>
    </div>
  );
}
