import { useEffect, useMemo, useState } from "react";

/** Extract the best teaching takeaway */
function lessonLearntFromSubmission(submission) {
  if (!submission) return "";
  const trimmed = submission.remediation?.trim();
  if (trimmed) return trimmed;
  const insight = submission.post_submit_insight;
  const fromInsight = [insight?.root_cause, insight?.fix_pattern].filter(Boolean).join(" ").trim();
  if (fromInsight) return fromInsight;
  return submission.feedback?.trim() || "";
}

/** Format remediation as a "🗑️ Vulnerable → ✅ Fixed" diff block */
function RemediationDiff({ vulnerableLines, code, remediation }) {
  if (!code || !remediation) return null;
  // Split the code into lines, mark the vulnerable ones
  const codeLines = code.split("\n");
  const vulnSet = new Set(vulnerableLines || []);
  return (
    <div className="remediation-diff">
      <div className="remediation-diff-col vulnerable">
        <div className="remediation-diff-head">
          <span className="remediation-diff-badge bad">Before</span>
        </div>
        <pre className="remediation-diff-code">
          {codeLines.map((line, idx) => {
            const lineNum = idx + 1;
            return (
              <div key={idx} className={vulnSet.has(lineNum) ? "diff-line diff-line-bad" : "diff-line"}>
                <span className="diff-lineno">{lineNum}</span>
                {vulnSet.has(lineNum) ? <span className="diff-marker">-</span> : <span className="diff-marker"> </span>}
                <span className="diff-text">{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
      <div className="remediation-diff-arrow">→</div>
      <div className="remediation-diff-col fixed">
        <div className="remediation-diff-head">
          <span className="remediation-diff-badge good">After</span>
        </div>
        <div className="remediation-diff-desc">{remediation}</div>
      </div>
    </div>
  );
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
  const lessonLearnt = submission ? lessonLearntFromSubmission(submission) : "";

  useEffect(() => {
    if (submission?.passed) setShowCongrats(true);
  }, [submission]);

  return (
    <article className="submission-panel">
      {/* Congratulations overlay */}
      {showCongrats && submission?.passed ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Challenge completed">
          <div className="modal-card modal-card-success pass-celebration-card">
            <div className="pass-celebration-top">
              <div className="pass-celebration-icon" aria-hidden="true">✓</div>
              <button
                type="button"
                className="icon-button pass-celebration-close"
                onClick={() => setShowCongrats(false)}
                aria-label="Close">×</button>
            </div>
            <h3 className="pass-celebration-title">Found it!</h3>

            {/* ── How to fix it ── */}
            {lessonLearnt ? (
              <div className="pass-celebration-lesson">
                <p className="pass-celebration-lesson-label">How it should have been written</p>
                <p className="pass-celebration-lesson-body">{lessonLearnt}</p>
              </div>
            ) : null}

            {/* ── Before / After diff ── */}
            {insight?.fix_pattern ? (
              <RemediationDiff
                vulnerableLines={submission.matched_lines}
                code={submission?._challenge_code}
                remediation={insight.fix_pattern}
              />
            ) : null}

            {/* ── Why it matters ── */}
            {insight?.why_prod ? (
              <div className="pass-celebration-consequence">
                <p className="pass-celebration-consequence-label">What happens if this code stays in prod</p>
                <p className="pass-celebration-consequence-body">{insight.why_prod}</p>
              </div>
            ) : null}

            {insight?.root_cause ? (
              <div className="pass-celebration-root-cause">
                <p className="pass-celebration-root-cause-label">Root cause</p>
                <p className="pass-celebration-root-cause-body">{insight.root_cause}</p>
              </div>
            ) : null}

            {insight?.references?.length ? (
              <div className="pass-celebration-refs">
                <p className="pass-celebration-refs-label">Reference standards</p>
                <p className="pass-celebration-refs-tags">
                  {insight.references.map((ref) => (
                    <span key={ref} className="pass-celebration-ref-tag">{ref}</span>
                  ))}
                </p>
              </div>
            ) : null}

            <div className="modal-actions pass-celebration-actions">
              {hasNextChallenge && onNextChallenge ? (
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => { setShowCongrats(false); onNextChallenge(); }}
                >
                  Next challenge →
                </button>
              ) : null}
              <button type="button" className="button-ghost" onClick={() => setShowCongrats(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats bar */}
      <div className="submission-panel-primary">
        <div className="submission-stats-inline">
          <span>Attempts <strong>{attemptStats.total_attempts}</strong></span>
          <span className="submission-stats-divider" aria-hidden="true">|</span>
          <span>Success <strong>{attemptStats.success_rate}%</strong></span>
          <span className="submission-stats-divider" aria-hidden="true">|</span>
          <span>Selected <strong>{selectedCount}</strong></span>
        </div>
        <div className="submission-prompt">
          <span className="submission-prompt-icon" aria-hidden="true">🎯</span>
          <p>Click the lines that contain the vulnerability, then submit.</p>
        </div>
      </div>

      {/* Hints */}
      {hints?.length ? (
        <details className="submission-disclosure">
          <summary>Need a hint? ({hints.length})</summary>
          <ul className="submission-hint-list">
            {hints.map((hint) => <li key={hint}>{hint}</li>)}
          </ul>
        </details>
      ) : null}

      {/* Failed attempt */}
      {submission && !submission.passed ? (
        <div className={`submission-box failed`}>
          <div className="submission-result-head">
            <h4>
              Score {submission.score}/100
              <span className="submission-pass-label is-fail">Try again</span>
            </h4>
            <p className="submission-xp-line">XP +{xpGain}</p>
          </div>
          <p className="submission-feedback">{submission.feedback}</p>

          <details className="submission-disclosure submission-disclosure-tight">
            <summary>What was actually vulnerable?</summary>
            <p className="submission-remediation-body">{submission.remediation}</p>
          </details>

          {insight && (insight.root_cause || insight.fix_pattern || insight.why_prod || insight.references?.length) ? (
            <details className="submission-disclosure submission-disclosure-insight">
              <summary>How to fix it &amp; what happens if you don&apos;t</summary>
              <div className="post-submit-insight">
                {insight.root_cause ? (
                  <p><strong>Root cause:</strong> {insight.root_cause}</p>
                ) : null}
                {insight.fix_pattern ? (
                  <div>
                    <p><strong>Fix pattern:</strong></p>
                    <div className="insight-fix-block">{insight.fix_pattern}</div>
                  </div>
                ) : null}
                {insight.why_prod ? (
                  <div className="insight-consequence-block">
                    <p><strong>If this stays in prod:</strong></p>
                    <p>{insight.why_prod}</p>
                  </div>
                ) : null}
                {insight.references?.length ? (
                  <p className="insight-refs"><strong>References:</strong> {insight.references.join(" · ")}</p>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      {/* Passed (after overlay closed) */}
      {submission?.passed && !showCongrats ? (
        <p className="submission-pass-summary">
          <span className="submission-pass-summary-mark">✓ Pass</span>
          Score {submission.score}/100 · XP +{xpGain}
        </p>
      ) : null}

      {/* Actions */}
      <div className="submission-actions">
        <button type="button" className="button-ghost" onClick={onClear}>
          Clear selection
        </button>
        <button
          type="button"
          className="button-primary submission-cta"
          onClick={onSubmit}
          disabled={isSubmitting}>
          {isSubmitting ? "Scoring…" : "Submit review"}
        </button>
      </div>
    </article>
  );
}

export default SubmissionPanel;
