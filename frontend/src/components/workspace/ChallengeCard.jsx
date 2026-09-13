import { TRACK_LABEL } from "../../constants/ui";

/**
 * Extract a short lead-in from the scenario — first sentence or key phrase.
 * Makes the challenge card feel like a real-world headline.
 */
function scenarioLead(scenario) {
  if (!scenario) return null;
  const firstSentence = scenario.split(/[.?!]\s/)[0];
  if (firstSentence.length <= 120) return firstSentence;
  return firstSentence.slice(0, 117) + "...";
}

const CATEGORY_COLORS = {
  "llm-ai": "#7c5cfc",
  "injection": "#e54646",
  "server-side": "#e59500",
  "auth": "#19a974",
  "api": "#357edd",
  "data": "#6a7c8f",
  "client": "#d46cf4",
  "infra": "#4ab8c1",
  "mcp": "#fc7c5c",
};

function ChallengeCard({ challenge, isActive, categoryTitle, onSelect }) {
  const lead = scenarioLead(challenge.scenario);
  const dotColor = CATEGORY_COLORS[challenge.category] || "#8ea2cf";

  return (
    <button
      type="button"
      className={`challenge-card ${isActive ? "is-active" : ""}`}
      onClick={() => onSelect(challenge.id)}
    >
      <div className="cc-top-row">
        <span className="cc-dot" style={{ background: dotColor }} />
        <div className="cc-meta">
          <span className={`pill pill-track pill-track-${challenge.track}`}>
            {TRACK_LABEL[challenge.track] || challenge.track.toUpperCase()}
          </span>
          <span className="pill pill-difficulty">{challenge.difficulty}</span>
        </div>
      </div>

      <h3 className="cc-title">{challenge.title}</h3>

      {lead && (
        <p className="cc-lead">"{lead}"</p>
      )}

      <div className="challenge-meta cc-footer">
        <span>{challenge.language}</span>
        <span>{categoryTitle}</span>
        <span>{challenge.points} pts</span>
      </div>
    </button>
  );
}

export default ChallengeCard;
