import './pm.css';

export type PmEndingType =
  | 'legendary'         // 外交・経済・安保すべて高い
  | 'longterm'          // 長期安定政権
  | 'economist'         // 経済重視・外交低い
  | 'hawk'              // 安保強硬・支持率低い
  | 'coalition_failure' // 連立崩壊
  | 'disgraced';        // 支持率低下・スキャンダル

const ENDING_DATA: Record<PmEndingType, { icon: string; title: string; desc: string }> = {
  legendary: {
    icon: '🏛️',
    title: '歴史に名を残す名宰相エンド',
    desc: '外交・経済・安全保障の三拍子揃った実績と高い国民の支持を背景に、あなたは時代を動かした名宰相として後世に語り継がれた。その治世は日本の黄金時代として歴史に刻まれる。',
  },
  longterm: {
    icon: '⏳',
    title: '長期安定政権エンド',
    desc: '3年以上にわたる長期政権を実現した。派手さはなかったが、着実な国家運営で国民の信頼を積み重ねた。「安定の宰相」として後に評価されることになる。',
  },
  economist: {
    icon: '📈',
    title: '内向き経済重視の総理エンド',
    desc: '国内経済の立て直しには成功したが、外交面での存在感は薄かった。国内では評価される一方、国際社会でのリーダーシップは限定的だった。',
  },
  hawk: {
    icon: '🦅',
    title: '強硬路線で支持を失った総理エンド',
    desc: '強固な安全保障政策を推し進めたが、国民の理解が追いつかなかった。歴史的には再評価されるかもしれないが、在任中の支持率は低迷が続いた。',
  },
  coalition_failure: {
    icon: '💔',
    title: '政局に敗れた総理エンド',
    desc: '連立の維持に失敗し、与党内の分裂が政権崩壊を招いた。政策の実現よりも政局対応に追われ、志半ばで総理の座を降りることになった。',
  },
  disgraced: {
    icon: '📉',
    title: '国民の信頼を失った総理エンド',
    desc: '相次ぐスキャンダルと支持率の記録的な低下が政権の終わりを告げた。政治の厳しさを身をもって経験した。再起を期して、次の道を歩み始めよう。',
  },
};

export function calcPmEnding(
  diplomacy:     number,
  economy:       number,
  security:      number,
  approval:      number,
  coalition:     number,
  scandalCount:  number,
  term:          number,
): PmEndingType {
  if (coalition <= 0)                                      return 'coalition_failure';
  if (scandalCount >= 3 || approval < 15)                  return 'disgraced';
  const total = diplomacy + economy + security;
  if (term >= 3 && total >= 180 && approval >= 50)         return 'legendary';
  if (term >= 3)                                           return 'longterm';
  if (total >= 180 && approval >= 55)                      return 'legendary';
  if (economy >= 70 && diplomacy < 40)                     return 'economist';
  if (security >= 70 && approval < 35)                     return 'hawk';
  if (scandalCount >= 2 || approval < 25)                  return 'disgraced';
  return 'longterm';
}

interface Props {
  endingType:      PmEndingType;
  cabinetTerm:     number;
  diplomacyScore:  number;
  economyScore:    number;
  securityScore:   number;
  onReturnToTitle: () => void;
}

export default function PrimeMinisterEndingModal({
  endingType, cabinetTerm, diplomacyScore, economyScore, securityScore, onReturnToTitle,
}: Props) {
  const data = ENDING_DATA[endingType];
  return (
    <div className="pmend-overlay">
      <div className="pmend-panel">
        <div className="pmend-icon">{data.icon}</div>
        <h2 className="pmend-title">{data.title}</h2>
        <p className="pmend-desc">{data.desc}</p>
        <div className="pmend-stats">
          <span>通算 {cabinetTerm} 次内閣</span>
          <span>外交 {diplomacyScore}</span>
          <span>経済 {economyScore}</span>
          <span>安保 {securityScore}</span>
        </div>
        <button className="pmend-btn" onClick={onReturnToTitle}>タイトルに戻る</button>
      </div>
    </div>
  );
}
