import { useEffect, useState } from "react";

import { createTrainingClient } from "../services/reviewerApi";

function formatAttemptWhen(iso) {
  if (!iso) {
    return "";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProgressSkeleton() {
  return (
    <div className="progress-skeleton" aria-busy="true" aria-label="Loading progress">
      <div className="progress-skeleton-metrics">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className="progress-skeleton-tile" />
        ))}
      </div>
      <div className="progress-skeleton-bar" />
      <div className="progress-skeleton-list">
        {[1, 2, 3].map((key) => (
          <div key={key} className="progress-skeleton-row" />
        ))}
      </div>
    </div>
  );
}

function ProgressPage({ csrfToken, onNavigate }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const api = createTrainingClient(csrfToken);

    async function loadProgress() {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getProgress();
        if (!ignore) {
          setProgress(payload);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Failed to load progress data.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProgress();
    return () => {
      ignore = true;
    };
  }, [csrfToken]);

  const successRate = progress ? Math.min(100, Math.max(0, progress.success_rate)) : 0;
  const avgRounded = progress ? Math.round(progress.average_score) : 0;

  return (
    <section className="progress-page" aria-labelledby="progress-heading">
      <header className="progress-hero">
        <p className="section-label">Learning progress</p>
        <div className="progress-hero-row">
          <div>
            <h1 id="progress-heading">Your training snapshot</h1>
            <p className="progress-lead">
              Track attempts, pass rate, and average score. Recent submissions show how you are trending challenge
              by challenge.
            </p>
          </div>
          {onNavigate ? (
            <button type="button" className="button-primary progress-hero-cta" onClick={() => onNavigate("/learn")}>
              Continue learning
            </button>
          ) : null}
        </div>
      </header>

      {loading ? <ProgressSkeleton /> : null}

      {!loading && error ? <p className="progress-error">{error}</p> : null}

      {!loading && !error && progress ? (
        <>
          <div className="progress-metrics" role="list">
            <article className="progress-metric" role="listitem">
              <p className="progress-metric-label">Total attempts</p>
              <p className="progress-metric-value">{progress.total_attempts}</p>
              <p className="progress-metric-hint">All scored submissions</p>
            </article>
            <article className="progress-metric progress-metric--accent" role="listitem">
              <p className="progress-metric-label">Success rate</p>
              <p className="progress-metric-value">{progress.success_rate}%</p>
              <p className="progress-metric-hint">
                {progress.successful_attempts} clears / {progress.total_attempts} attempts
              </p>
            </article>
            <article className="progress-metric" role="listitem">
              <p className="progress-metric-label">Average score</p>
              <p className="progress-metric-value">{avgRounded}</p>
              <p className="progress-metric-hint">Out of 100</p>
            </article>
            <article className="progress-metric" role="listitem">
              <p className="progress-metric-label">Challenges cleared</p>
              <p className="progress-metric-value">{progress.challenges_completed}</p>
              <p className="progress-metric-hint">Distinct passes</p>
            </article>
          </div>

          <div className="progress-pass-visual">
            <div className="progress-pass-labels">
              <span>Pass momentum</span>
              <span>{progress.total_attempts ? `${successRate}%` : "—"}</span>
            </div>
            <div
              className="progress-pass-track"
              role="progressbar"
              aria-valuenow={successRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Success rate"
            >
              <div className="progress-pass-fill" style={{ width: `${successRate}%` }} />
            </div>
          </div>

          <section className="progress-activity" aria-labelledby="progress-activity-title">
            <div className="progress-activity-head">
              <h2 id="progress-activity-title">Recent attempts</h2>
              <p className="progress-activity-sub">Newest first</p>
            </div>
            {progress.recent_attempts?.length ? (
              <ul className="progress-attempt-list">
                {progress.recent_attempts.map((attempt) => (
                  <li key={`${attempt.challenge_id}-${attempt.created_at}`} className="progress-attempt-card">
                    <span
                      className={`progress-attempt-badge ${attempt.passed ? "is-pass" : "is-retry"}`}
                      aria-label={attempt.passed ? "Passed" : "Retry"}
                    >
                      {attempt.passed ? "Pass" : "Retry"}
                    </span>
                    <div className="progress-attempt-body">
                      <h3 className="progress-attempt-title">{attempt.challenge_title}</h3>
                      <p className="progress-attempt-meta">
                        Score <strong>{attempt.score}</strong>
                        <span className="progress-attempt-dot" aria-hidden="true">
                          ·
                        </span>
                        <time dateTime={attempt.created_at}>{formatAttemptWhen(attempt.created_at)}</time>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="progress-empty">
                <p>No attempts yet.</p>
                {onNavigate ? (
                  <button type="button" className="button-ghost" onClick={() => onNavigate("/learn")}>
                    Open Learn
                  </button>
                ) : null}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

export default ProgressPage;
