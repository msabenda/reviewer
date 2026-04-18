import { useEffect, useState } from "react";

import { createTrainingClient } from "../services/reviewerApi";

function PodiumColumn({ place, variant, entry }) {
  const hasEntry = Boolean(entry);

  return (
    <div className={`ctf-lb-podium-col ctf-lb-podium-col--${variant}`} role="listitem">
      <div className="ctf-lb-podium-rank-badge" aria-hidden="true">
        {place === 1 ? "①" : place === 2 ? "②" : "③"}
      </div>
      {hasEntry ? (
        <>
          <div className="ctf-lb-podium-card">
            <p className="ctf-lb-podium-name">{entry.full_name}</p>
            <p className="ctf-lb-podium-score" aria-label={`Average score ${Math.round(entry.average_score)}`}>
              {Math.round(entry.average_score)}
            </p>
            <p className="ctf-lb-podium-score-label">avg score</p>
            <dl className="ctf-lb-podium-stats">
              <div>
                <dt>Clears</dt>
                <dd>
                  {entry.successful_attempts}/{entry.total_attempts}
                </dd>
              </div>
              <div>
                <dt>Rate</dt>
                <dd>{entry.success_rate}%</dd>
              </div>
            </dl>
          </div>
          <div className="ctf-lb-podium-base" aria-hidden="true" />
        </>
      ) : (
        <div className="ctf-lb-podium-empty">
          <p className="ctf-lb-podium-empty-label">awaiting operator</p>
          <div className="ctf-lb-podium-base ctf-lb-podium-base--ghost" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="ctf-lb-skeleton" aria-busy="true" aria-label="Loading leaderboard">
      <div className="ctf-lb-skeleton-podium">
        <div className="ctf-lb-skeleton-block" />
        <div className="ctf-lb-skeleton-block ctf-lb-skeleton-block--tall" />
        <div className="ctf-lb-skeleton-block" />
      </div>
      <div className="ctf-lb-skeleton-rows">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className="ctf-lb-skeleton-row" />
        ))}
      </div>
    </div>
  );
}

function LeaderboardPage({ csrfToken }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const api = createTrainingClient(csrfToken);

    async function loadLeaderboard() {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getLeaderboard(100);
        if (!ignore) {
          setRows(payload);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Failed to load leaderboard.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();
    return () => {
      ignore = true;
    };
  }, [csrfToken]);

  const first = rows[0];
  const second = rows[1];
  const third = rows[2];
  const standingsRest = rows.slice(3);

  return (
    <section className="ctf-lb" aria-labelledby="ctf-lb-heading">
      <header className="ctf-lb-hero">
        <div className="ctf-lb-hero-grid" aria-hidden="true" />
        <div className="ctf-lb-hero-scan" aria-hidden="true" />

        <div className="ctf-lb-hero-top">
          <div className="ctf-lb-hero-chips">
            <span className="ctf-lb-chip ctf-lb-chip--live">
              <span className="ctf-lb-live-dot" aria-hidden="true" />
              LIVE
            </span>
            <span className="ctf-lb-chip">secure_code_ctf</span>
            <span className="ctf-lb-chip">ranked</span>
          </div>
          <p className="ctf-lb-hero-meta">
            <span className="ctf-lb-meta-k">event</span>{" "}
            <span className="ctf-lb-meta-v">training_arena</span>
            <span className="ctf-lb-meta-sep" aria-hidden="true">
              {" "}
              ·{" "}
            </span>
            <span className="ctf-lb-meta-k">objective</span>{" "}
            <span className="ctf-lb-meta-v">top_avg_score</span>
          </p>
        </div>

        <h1 id="ctf-lb-heading" className="ctf-lb-heading">
          <span className="ctf-lb-heading-label">scoreboard</span>
          <span className="ctf-lb-heading-main">OPERATOR_RANK</span>
        </h1>
        <p className="ctf-lb-lead">
          Rankings from challenge submissions — average score, clear rate, and attempt volume. Climb by passing
          reviews cleanly.
        </p>
      </header>

      {loading ? <LeaderboardSkeleton /> : null}

      {!loading && error ? <p className="ctf-lb-error">{error}</p> : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="ctf-lb-empty">
          <div className="ctf-lb-empty-icon" aria-hidden="true">
            {"{ }"}
          </div>
          <h2 className="ctf-lb-empty-title">No captures yet</h2>
          <p className="ctf-lb-empty-copy">
            The board is empty. Finish a training challenge with a pass to broadcast your handle here.
          </p>
        </div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <>
          <div className="ctf-lb-podium-wrap">
            <h2 className="ctf-lb-section-title">
              <span className="ctf-lb-section-hash">#</span> podium
            </h2>
            <div className="ctf-lb-podium" role="list">
              <PodiumColumn place={2} variant="silver" entry={second} />
              <PodiumColumn place={1} variant="gold" entry={first} />
              <PodiumColumn place={3} variant="bronze" entry={third} />
            </div>
          </div>

          <div className="ctf-lb-table-section">
            <div className="ctf-lb-table-section-head">
              <h2 className="ctf-lb-section-title">
                <span className="ctf-lb-section-hash">#</span> standings
              </h2>
              {standingsRest.length > 0 ? (
                <p className="ctf-lb-standings-caption">
                  Ranks {standingsRest[0].rank}–{standingsRest[standingsRest.length - 1].rank} · {standingsRest.length}{" "}
                  {standingsRest.length === 1 ? "player" : "players"}
                </p>
              ) : (
                <p className="ctf-lb-standings-caption">Everyone is on the podium — more scores will list here.</p>
              )}
            </div>
            {standingsRest.length > 0 ? (
              <div className="ctf-lb-table-scroll">
                <table className="ctf-lb-table">
                  <thead>
                    <tr>
                      <th scope="col">rank</th>
                      <th scope="col">operator</th>
                      <th scope="col">avg</th>
                      <th scope="col">clear %</th>
                      <th scope="col">attempts</th>
                      <th scope="col">clears</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standingsRest.map((entry) => (
                      <tr key={entry.rank}>
                        <td className="ctf-lb-td-rank">
                          <span className="ctf-lb-rank-pill">{entry.rank}</span>
                        </td>
                        <td className="ctf-lb-td-op">
                          <span className="ctf-lb-op-name">{entry.full_name}</span>
                        </td>
                        <td className="ctf-lb-td-num">{Math.round(entry.average_score)}</td>
                        <td className="ctf-lb-td-num">{entry.success_rate}%</td>
                        <td className="ctf-lb-td-num">{entry.total_attempts}</td>
                        <td className="ctf-lb-td-num">
                          {entry.successful_attempts}/{entry.total_attempts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default LeaderboardPage;
