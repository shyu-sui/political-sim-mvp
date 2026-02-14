// import React from 'react';

type Props = {
  cleared: boolean;
  over: boolean;
  onReset: () => void;
};

export default function FinishBanner({ cleared, over, onReset }: Props) {
  if (!cleared && !over) return null;

  return (
    <div className={`tl-finishbar ${cleared ? 'tl-clear' : 'tl-over'}`}>
      <strong>{cleared ? 'クリア！' : 'ゲームオーバー'}</strong>
      <span>
        {cleared ? '市議選へ挑戦する準備が整いました。' : '条件を満たせず、活動が終了しました。'}
      </span>
      <button onClick={onReset}>もう一度</button>
    </div>
  );
}