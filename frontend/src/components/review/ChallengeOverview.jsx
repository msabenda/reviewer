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
        <p className="overview-summary">{challenge.description}</p>
      </div>

      <details className="overview-disclosure">
        <summary>Review brief &amp; extra context</summary>
        <div className="overview-disclosure-body">
          {challenge.scenario ? (
            <div className="overview-brief">
              <h3 className="overview-disclosure-heading">Scenario</h3>
              <p>{challenge.scenario}</p>
            </div>
          ) : null}
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
    </article>
  );
}

export default ChallengeOverview;
