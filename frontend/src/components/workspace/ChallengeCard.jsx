import { TRACK_LABEL } from "../../constants/ui";

function ChallengeCard({ challenge, isActive, categoryTitle, onSelect }) {
  return (
    <button
      type="button"
      className={`challenge-card ${isActive ? "is-active" : ""}`}
      onClick={() => onSelect(challenge.id)}
    >
      <div className="meta-pills">
        <span className={`pill pill-track pill-track-${challenge.track}`}>
          {TRACK_LABEL[challenge.track] || challenge.track.toUpperCase()}
        </span>
        <span className="pill pill-difficulty">{challenge.difficulty}</span>
      </div>
      <h3>{challenge.title}</h3>
      <p>{challenge.description}</p>
      <div className="challenge-meta">
        <span>{challenge.language}</span>
        <span>{categoryTitle}</span>
        <span>{challenge.points} pts</span>
      </div>
    </button>
  );
}

export default ChallengeCard;
