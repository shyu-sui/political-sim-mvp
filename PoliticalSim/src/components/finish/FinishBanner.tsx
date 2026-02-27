export type FinishStage =
  | 'citizen'           // 一般市民クリア → 市議選へ立候補する
  | 'cityCandidate'     // 市議選挑戦中クリア → 投票結果を見る
  | 'cityCouncil'       // 市議当選 → 市議会を開始する
  | 'nationalCandidate' // 国政挑戦 → 国会議員選挙へ進む

const NEXT_LABEL: Record<FinishStage, string> = {
  citizen:           '市議選へ立候補する',
  cityCandidate:     '投票結果を見る',
  cityCouncil:       '市議会を開始する',
  nationalCandidate: '国会議員選挙へ進む',
};

type Props = {
  cleared: boolean;
  over: boolean;
  stage: FinishStage;
  onReset: () => void;
  onNextStage: () => void;
};

export default function FinishBanner({ cleared, over, stage, onReset, onNextStage }: Props) {
  if (!cleared && !over) return null;

  return (
    <div className={`tl-finishbar ${cleared ? 'tl-clear' : 'tl-over'}`}>
      <strong>{cleared ? 'クリア！' : 'ゲームオーバー'}</strong>
      <span>
        {cleared ? '次のステージへ進みましょう。' : '条件を満たせず、活動が終了しました。'}
      </span>
      {over    && <button onClick={onReset}>もう一度</button>}
      {cleared && <button onClick={onNextStage}>{NEXT_LABEL[stage]}</button>}
    </div>
  );
}
