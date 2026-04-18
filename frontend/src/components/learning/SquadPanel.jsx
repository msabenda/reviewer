import { useEffect, useState } from "react";

import { createTrainingClient } from "../../services/reviewerApi";

function SquadPanel({ csrfToken }) {
  const [pulse, setPulse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!csrfToken) {
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const client = createTrainingClient(csrfToken);
        const data = await client.getSquadPulse();
        if (!cancelled) {
          setPulse(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load team pulse.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [csrfToken]);

  return (
    <section className="squad-panel" aria-labelledby="squad-title">
      <header className="squad-panel-head">
        <h2 id="squad-title">Team pulse</h2>
        <p className="squad-panel-lede">
          Lightweight squad view: weekly focus plus real attempt counts (last 7 days). Use it for
          standups or guild goals—not a second leaderboard.
        </p>
      </header>

      {error ? <p className="squad-panel-error">{error}</p> : null}

      {pulse ? (
        <div className="squad-panel-card">
          <div className="squad-panel-metrics">
            <div>
              <span className="squad-metric-label">Your passes (7d)</span>
              <span className="squad-metric-value">{pulse.your_passes_last_7_days}</span>
            </div>
            <div>
              <span className="squad-metric-label">Org attempts (7d)</span>
              <span className="squad-metric-value">{pulse.org_attempts_last_7_days}</span>
            </div>
          </div>
          <h3 className="squad-mission-title">{pulse.mission_title}</h3>
          <p className="squad-mission-body">{pulse.mission_detail}</p>
          <dl className="squad-mission-meta">
            <div>
              <dt>Focus tracks</dt>
              <dd>{pulse.focus_tracks.join(", ")}</dd>
            </div>
            <div>
              <dt>Suggested challenges</dt>
              <dd>
                <code className="inline-code">{pulse.suggested_challenge_ids.join(", ")}</code>
              </dd>
            </div>
          </dl>
        </div>
      ) : !error ? (
        <p className="squad-panel-placeholder">Loading team pulse…</p>
      ) : null}
    </section>
  );
}

export default SquadPanel;
