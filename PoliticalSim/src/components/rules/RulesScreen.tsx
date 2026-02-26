import { useState } from 'react';
import './RulesScreen.css';

interface Props {
  onSkip: () => void;
  onNext: () => void;
}

type RulePage = {
  icon:  string;
  title: string;
  body:  string[];
};

const PAGES: RulePage[] = [
  {
    icon: '🗳️',
    title: 'ゲームの目的',
    body: [
      'あなたは「アルメリア共和国」の一般市民。選挙告示1週間前、友人との会話をきっかけに政治の世界へ踏み込みます。',
      '日々の行動・発言・選択が世論・支持率・信念スコアを動かします。あなたの選択が国の未来を形作ります。',
    ],
  },
  {
    icon: '🎯',
    title: '信念スコア（Belief Score）',
    body: [
      '「経済・福祉・安全保障・環境・外交」の5軸で、あなたの政治的立場が数値化されます。',
      '発言や行動が矛盾すると「一貫性スコア」が低下。メディア批判・支持者離脱・党内信用低下につながります。',
      '一貫性が高いと支持が安定し、交渉で有利になります。',
    ],
  },
  {
    icon: '⚡',
    title: 'イベントの種類',
    body: [
      '【討論バトル】ターン制のスキル選択で相手の主張を崩せ。ロジック・データ・感情・揚げ足取りを使い分けよう。',
      '【スキャンダル】不祥事・誘惑・資金問題が突然発生。対応次第で支持率が急落——または守りきれる。',
      '【外交・経済】隣国との交渉や国内政策の選択が長期的に影響します。短期人気取りは長期悪化のリスクも。',
    ],
  },
  {
    icon: '🌍',
    title: '選択が世界を動かす',
    body: [
      'あなたの行動は友人・SNS・世論を通じて連鎖的に波及します。',
      '架空の国「アルメリア共和国」では、あなたの選択次第で政局が大きく変わります。',
      'ゲーム終了後は「答え合わせ画面」で、あなたの選択が生み出した世界の結果を振り返れます。',
    ],
  },
];

export default function RulesScreen({ onSkip, onNext }: Props) {
  const [page, setPage] = useState(0);
  const current = PAGES[page];
  const isLast  = page === PAGES.length - 1;

  return (
    <div className="rs-overlay">
      <div className="rs-panel">
        {/* ヘッダー */}
        <div className="rs-header">
          <span className="rs-step">{page + 1} / {PAGES.length}</span>
          <button className="rs-skip" onClick={onSkip}>スキップ</button>
        </div>

        {/* ページ内容 */}
        <div className="rs-content">
          <div className="rs-icon">{current.icon}</div>
          <h2 className="rs-title">{current.title}</h2>
          <div className="rs-body">
            {current.body.map((line, i) => (
              <p key={i} className="rs-line">{line}</p>
            ))}
          </div>
        </div>

        {/* ページドット */}
        <div className="rs-dots">
          {PAGES.map((_, i) => (
            <button
              key={i}
              className={`rs-dot${i === page ? ' active' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`ページ ${i + 1}`}
            />
          ))}
        </div>

        {/* ナビゲーション */}
        <div className="rs-nav">
          <button
            className="rs-btn-back"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
          >
            ← 前へ
          </button>
          {isLast ? (
            <button className="rs-btn-start" onClick={onNext}>
              ゲームを始める →
            </button>
          ) : (
            <button className="rs-btn-next" onClick={() => setPage(p => p + 1)}>
              次へ →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
