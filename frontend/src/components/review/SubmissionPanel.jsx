import { useEffect, useState } from "react";

/** Primary teaching takeaway for the success dialog (API remediation > insight > feedback). */
function lessonLearntFromSubmission(submission) {
  if (!submission) {
    return "";
  }
  const trimmed = submission.remediation?.trim();
  if (trimmed) {
    return trimmed;
  }
  const insight = submission.post_submit_insight;
  const fromInsight = [insight?.root_cause, insight?.fix_pattern].filter(Boolean).join(" ").trim();
  if (fromInsight) {
    return fromInsight;
  }
  return submission.feedback?.trim() || "";
}

function SubmissionPanel({
  attemptStats,
  isSubmitting,
  onSubmit,
  onClear,
  hints,
  submission,
  challengePoints,
  selectedCount,
  hasNextChallenge,
  onNextChallenge,
}) {
  const xpGain = submission ? Math.round((challengePoints * submission.score) / 100) : 0;
  const [showCongrats, setShowCongrats] = useState(false);

  const insight = submission?.post_submit_insight;
  const hasInsight =
    insight &&
    (insight.root_cause || insight.fix_pattern || insight.why_prod || insight.references?.length);

  const lessonLearnt = submission ? lessonLearntFromSubmission(submission) : "";

  useEffect(() => {
    if (submission?.passed) {
      setShowCongrats(true);
    }
  }, [submission]);

  return (
    <article className="submission-panel">
      {showCongrats && submission?.passed ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Challenge completed">
          <div className="modal-card modal-card-success pass-celebration-card">
            <div className="pass-celebration-top">
              <div className="pass-celebration-icon" aria-hidden="true">
                ✓
              </div>
              <button
                type="button"
                className="icon-button pass-celebration-close"
                onClick={() => setShowCongrats(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <h3 className="pass-celebration-title">Congratulations</h3>
            <div className="pass-celebration-lesson">
              <p className="pass-celebration-lesson-label">Lesson learnt</p>
              <p className="pass-celebration-lesson-body">
                {lessonLearnt || "Review the remediation notes in the challenge materials to reinforce this pattern."}
              </p>
            </div>
            <div className="modal-actions pass-celebration-actions">
              {hasNextChallenge && onNextChallenge ? (
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => {
                    setShowCongrats(false);
                    onNextChallenge();
                  }}
                >
                  Next challenge
                </button>
              ) : null}
              <button type="button" className="button-ghost" onClick={() => setShowCongrats(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="submission-panel-primary">
        <div className="submission-stats-inline">
          <span>
            Attempts <strong>{attemptStats.total_attempts}</strong>
          </span>
          <span className="submission-stats-divider" aria-hidden="true">
            |
          </span>
          <span>
            Success <strong>{attemptStats.success_rate}%</strong>
          </span>
          <span className="submission-stats-divider" aria-hidden="true">
            |
          </span>
          <span>
            Selected <strong>{selectedCount}</strong>
          </span>
        </div>

        <div className="submission-actions-top">
          <p className="submission-points-line">{challengePoints} points · click vulnerable lines, then submit</p>
        </div>
      </div>

      {hints?.length ? (
        <details className="submission-disclosure">
          <summary>Hints ({hints.length})</summary>
          <ul className="submission-hint-list">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {submission && !submission.passed ? (
        <div className={`submission-box failed`}>
          <div className="submission-result-head">
            <h4>
              Score {submission.score}/100
              <span className="submission-pass-label is-fail">Retry</span>
            </h4>
            <p className="submission-xp-line">XP +{xpGain}</p>
          </div>
          <p className="submission-feedback">{submission.feedback}</p>

          <details className="submission-disclosure submission-disclosure-tight">
            <summary>Suggested remediation</summary>
            <p className="submission-remediation-body">{submission.remediation}</p>
          </details>

          {hasInsight ? (
            <details className="submission-disclosure submission-disclosure-insight">
              <summary>Post-review: root cause, prod impact, references</summary>
              <div className="post-submit-insight">
                {insight.root_cause ? (
                  <p>
                    <strong>Root cause:</strong> {insight.root_cause}
                  </p>
                ) : null}
                {insight.fix_pattern ? (
                  <p>
                    <strong>Fix pattern:</strong> {insight.fix_pattern}
                  </p>
                ) : null}
                {insight.why_prod ? (
                  <p>
                    <strong>Why prod differs:</strong> {insight.why_prod}
                  </p>
                ) : null}
                {insight.references?.length ? (
                  <p className="insight-refs">
                    <strong>References:</strong> {insight.references.join(" · ")}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      {submission?.passed && !showCongrats ? (
        <p className="submission-pass-summary">
          <span className="submission-pass-summary-mark">Pass</span>
          Score {submission.score}/100 · XP +{xpGain}
        </p>
      ) : null}

      <div className="submission-actions">
        <button type="button" className="button-ghost" onClick={onClear}>
          Clear selection
        </button>
        <button
          type="button"
          className="button-primary submission-cta"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Scoring…" : "Submit review"}
        </button>
      </div>
    </article>
  );
}

export default SubmissionPanel;
