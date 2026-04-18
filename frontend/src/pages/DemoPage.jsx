import { useEffect, useState } from "react";

import { createDemoClient } from "../services/reviewerApi";

function DemoPage({ onNavigate }) {
  const [challenges, setChallenges] = useState([]);
  const [stackFilter, setStackFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const api = createDemoClient();

    async function loadChallenges() {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getChallenges();
        if (!ignore) {
          setChallenges(payload);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Failed to load demo challenges.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadChallenges();
    return () => {
      ignore = true;
    };
  }, []);

  const difficultyRank = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const orderedChallenges = [...challenges].sort((a, b) => {
    if (a.difficulty !== b.difficulty) {
      return (difficultyRank[a.difficulty] || 99) - (difficultyRank[b.difficulty] || 99);
    }
    return a.points - b.points;
  });

  const stacks = [...new Set(challenges.map((challenge) => challenge.language))].sort();
  const searchValue = search.trim().toLowerCase();
  const visibleChallenges = orderedChallenges.filter((challenge) => {
    if (stackFilter && challenge.language !== stackFilter) {
      return false;
    }
    if (!searchValue) {
      return true;
    }
    const haystack = `${challenge.title} ${challenge.description} ${challenge.language} ${challenge.framework}`.toLowerCase();
    return haystack.includes(searchValue);
  });

  return (
    <section className="demo-launcher">
      <div className="demo-launcher-head">
        <p className="section-label">Demo Challenges</p>
        <h1>Pick a challenge and open a dedicated editor page</h1>
        <p>
          Demo mode is intentionally simple: choose one challenge and start reviewing immediately.
        </p>
      </div>

      {loading ? <p className="status-text">Loading demo challenges...</p> : null}
      {error ? <p className="status-text error">{error}</p> : null}
      <div className="demo-filters">
        <label className="field-label">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search stack, framework, or challenge"
          />
        </label>
        <label className="field-label">
          Stack
          <select value={stackFilter} onChange={(event) => setStackFilter(event.target.value)}>
            <option value="">All stacks</option>
            {stacks.map((stack) => (
              <option key={stack} value={stack}>
                {stack}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="demo-launcher-grid">
        {visibleChallenges.map((challenge) => (
          <article
            key={challenge.id}
            className={`demo-launcher-card ${selectedChallengeId === challenge.id ? "is-selected" : ""}`}
            onMouseEnter={() => setSelectedChallengeId(challenge.id)}
          >
            <div className="meta-pills">
              <span className={`pill pill-track pill-track-${challenge.track}`}>{challenge.track.toUpperCase()}</span>
              <span className="pill pill-difficulty">{challenge.difficulty}</span>
            </div>
            <h3>{challenge.title}</h3>
            <p>{challenge.description}</p>
            <div className="challenge-meta">
              <span>{challenge.language}</span>
              <span>{challenge.points} pts</span>
              <span>{challenge.duration_minutes} min</span>
            </div>
            <button
              type="button"
              className="button-primary"
              onClick={() => {
                setSelectedChallengeId(challenge.id);
                onNavigate(`/demo/challenge?challenge=${challenge.id}`);
              }}
            >
              Open Challenge
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DemoPage;
