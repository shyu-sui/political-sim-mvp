import { useState, useEffect } from 'react';
import './StartScreen.css';

export type CharType = 'activist' | 'bureaucrat' | 'entrepreneur';

const charCards: {
  type: CharType;
  label: string;
  desc: string;
  bonus: string;
}[] = [
  { type: 'activist',     label: '活動家',   desc: 'コミュ力を武器に草の根運動を展開', bonus: 'コミュ力 +20' },
  { type: 'bureaucrat',   label: '官僚',     desc: '行政の知識と人脈で信頼を積み上げる', bonus: '信頼 +20' },
  { type: 'entrepreneur', label: '起業家',   desc: 'SNS戦略でフォロワーを一気に集める', bonus: 'フォロワー +200' },
];

interface Props {
  onStart: (playerName: string, charType: CharType) => void;
  onContinue: () => void;
}

export default function StartScreen({ onStart, onContinue }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [charType, setCharType] = useState<CharType>('activist');
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('politics-sim-save-v2');
    setHasSave(!!raw);
  }, []);

  const canStart = playerName.trim().length > 0;

  return (
    <div className="ss-overlay">
      <div className="ss-panel">
        <h1 className="ss-title">政治シミュレーション</h1>
        <p className="ss-subtitle">名前とキャラクターを選んでゲームを始めよう</p>

        <label className="ss-label">プレイヤー名</label>
        <input
          className="ss-input"
          type="text"
          placeholder="名前を入力..."
          value={playerName}
          onChange={(e) => setPlayerName(e.currentTarget.value)}
          maxLength={20}
        />

        <label className="ss-label">キャラクタータイプ</label>
        <div className="ss-cards">
          {charCards.map((c) => (
            <button
              key={c.type}
              className={`ss-card${charType === c.type ? ' selected' : ''}`}
              onClick={() => setCharType(c.type)}
            >
              <div className="ss-card-label">{c.label}</div>
              <div className="ss-card-desc">{c.desc}</div>
              <div className="ss-card-bonus">{c.bonus}</div>
            </button>
          ))}
        </div>

        <button
          className="ss-btn-start"
          disabled={!canStart}
          onClick={() => onStart(playerName.trim(), charType)}
        >
          ゲームを始める
        </button>

        {hasSave && (
          <button className="ss-btn-continue" onClick={onContinue}>
            コンティニュー（セーブデータを読み込む）
          </button>
        )}
      </div>
    </div>
  );
}
