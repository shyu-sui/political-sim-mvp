import './SettingsScreen.css';

interface Props {
  onSave:  () => void;
  onLoad:  () => void;
  onReset: () => void;
  onBack:  () => void;
}

export default function SettingsScreen({ onSave, onLoad, onReset, onBack }: Props) {
  return (
    <div className="ss-overlay">
      <div className="ss-panel">

        <div className="ss-header">
          <h2 className="ss-title">⚙️ 設定</h2>
          <button className="ss-back" onClick={onBack}>← 戻る</button>
        </div>

        <div className="ss-section">

          <div className="ss-item">
            <div className="ss-item-info">
              <span className="ss-item-name">セーブ</span>
              <span className="ss-item-desc">現在の進行状況をブラウザに保存します</span>
            </div>
            <button className="ss-btn ss-btn-save" onClick={onSave}>
              セーブ
            </button>
          </div>

          <div className="ss-item">
            <div className="ss-item-info">
              <span className="ss-item-name">ロード</span>
              <span className="ss-item-desc">保存した進行状況を読み込みます</span>
            </div>
            <button className="ss-btn ss-btn-load" onClick={onLoad}>
              ロード
            </button>
          </div>

          <div className="ss-item ss-item-danger">
            <div className="ss-item-info">
              <span className="ss-item-name">新規開始</span>
              <span className="ss-item-desc">データをリセットして最初からやり直します</span>
            </div>
            <button className="ss-btn ss-btn-reset" onClick={onReset}>
              新規開始
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
