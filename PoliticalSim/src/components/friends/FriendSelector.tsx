import { useState, useMemo } from 'react';
import { FRIEND_CHARS, type FriendChar } from './FriendChars';
import './friends.css';

interface Props {
  onSelect:       (char: FriendChar) => void;
  onCancel:       () => void;
  charAffinities?: Record<string, number>;
}

export default function FriendSelector({ onSelect, onCancel, charAffinities = {} }: Props) {
  // ランダムに3人を選ぶ（マウント時に固定）
  const candidates = useMemo<FriendChar[]>(() => {
    const shuffled = [...FRIEND_CHARS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fs-overlay">
      <div className="fs-panel">
        <div className="fs-header">
          <h3 className="fs-title">👥 話す相手を選ぶ</h3>
          <p className="fs-hint">今日話せる相手が3人います。誰と話しますか？</p>
        </div>

        <div className="fs-cards">
          {candidates.map(char => (
            <button
              key={char.id}
              className={`fs-card${hovered === char.id ? ' hovered' : ''}`}
              onClick={() => onSelect(char)}
              onMouseEnter={() => setHovered(char.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="fs-card-icon">{char.icon}</div>
              <div className="fs-card-name">{char.name}</div>
              <div className="fs-card-gender">{char.gender === 'male' ? '♂' : '♀'}</div>
              <div className={`fs-card-affinity ${
                (charAffinities[char.id] ?? 50) >= 70 ? 'high' :
                (charAffinities[char.id] ?? 50) <= 20 ? 'low' : ''
              }`}>
                好感度 {charAffinities[char.id] ?? 50}
              </div>
              <div className="fs-card-tap">話す →</div>
            </button>
          ))}
        </div>

        <button className="fs-cancel" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  );
}
