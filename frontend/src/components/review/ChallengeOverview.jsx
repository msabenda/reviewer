import { sdlcPhaseLabel } from "../../constants/sdlc";
import { TRACK_LABEL } from "../../constants/ui";
import SdlcPipelineStrip from "./SdlcPipelineStrip";

function ChallengeOverview({ challenge }) {
  const hasTrack = challenge.track;
  const pc = challenge.practice_context || {};
  const sdlc = pc.sdlc_phase;
  const week = pc.learning_week;
  const pattern = pc.pattern_family;

  const metaLine = [
    challenge.difficulty,
    `${challenge.points} pts`,
    sdlc ? sdlcPhaseLabel(sdlc) : null,
    week ? `Week ${week}` : null,
    hasTrack ? TRACK_LABEL[challenge.track] || challenge.track : null,
    challenge.language,
    challenge.framework,
    `${challenge.duration_minutes} min`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="challenge-overview">
      {sdlc ? <SdlcPipelineStrip phase={sdlc} /> : null}

      <div className="overview-header-block">
        <h2 className="overview-title">{challenge.title}</h2>
        <p className="overview-meta-line">{metaLine}</p>

        {challenge.scenario ? (
          <div className="ov-scenario-block">
            <span className="ov-scenario-tag">The incident</span>
            <p className="ov-scenario-text">{challenge.scenario}</p>
          </div>
        ) : (
          <p className="overview-summary">{challenge.description}</p>
        )}
      </div>

      <details className="overview-disclosure">
        <summary>Review brief &amp; context</summary>
        <div className="overview-disclosure-body">
          {pattern ? (
            <p className="overview-pattern">
              <strong>Pattern focus:</strong> {String(pattern).replace(/_/g, " ")}
            </p>
          ) : null}
          {pc.api_topics?.length ? (
            <p>
              <strong>Topics:</strong> {pc.api_topics.join(" · ")}
            </p>
          ) : null}
          {pc.spaced_repeat_note ? (
            <p>
              <strong>Spaced practice:</strong> {pc.spaced_repeat_note}
            </p>
          ) : null}
        </div>
      </details>

      <div className="ov-challenge-card">
        <div className="ov-card-section">
          <span className="ov-card-label">⬇ Your mission</span>
          <p className="ov-card-text">
            {challenge.description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default ChallengeOverview;
