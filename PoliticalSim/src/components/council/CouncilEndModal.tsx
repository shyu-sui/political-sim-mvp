import './CouncilEndModal.css';

interface Props {
  onReCityCouncil: () => void;
  onHouseElection: () => void;
}

export default function CouncilEndModal({ onReCityCouncil, onHouseElection }: Props) {
  return (
    <div className="cem-overlay">
      <div className="cem-panel">
        <div className="cem-icon">🏛</div>
        <h2 className="cem-title">市議会議員 任期終了</h2>
        <p className="cem-desc">
          4年間の市議会議員としての活動が終わりました。<br />
          次のステップを選んでください。
        </p>

        <div className="cem-choices">
          <button className="cem-btn cem-btn-city" onClick={onReCityCouncil}>
            <span className="cem-btn-icon">🏘</span>
            <span className="cem-btn-body">
              <strong>もう一度市議会議員選挙に挑戦する</strong>
              <small>引き続き地域に根ざした政治活動を続ける</small>
            </span>
          </button>

          <button className="cem-btn cem-btn-house" onClick={onHouseElection}>
            <span className="cem-btn-icon">🗾</span>
            <span className="cem-btn-body">
              <strong>衆議院議員選挙に挑戦する</strong>
              <small>国政の舞台へ。より大きな挑戦が待つ</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
