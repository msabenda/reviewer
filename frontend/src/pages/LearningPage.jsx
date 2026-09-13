import { useState } from "react";

import PlaybooksPanel from "../components/learning/PlaybooksPanel";
import SquadPanel from "../components/learning/SquadPanel";
import TrainingWorkspace from "../components/workspace/TrainingWorkspace";

const LEARN_TABS = [
  { id: "challenges", label: "Find & Fix", glyph: "🛡" },
  { id: "playbooks", label: "Playbooks", glyph: "📘" },
  { id: "squad", label: "Team pulse", glyph: "◎" },
];

const LEARN_SPARKS = [
  {
    title: "Real incidents",
    body: "Every challenge starts with a real-world breach narrative — not synthetic sanitized examples.",
  },
  {
    title: "Mark the exact lines",
    body: "Click only the code lines that introduced the vulnerability. Precision matters more than volume.",
  },
  {
    title: "Instant remediation",
    body: "Submit and get the fix pattern, root cause, and references to real CVEs and bug bounty writeups.",
  },
];

function LearningPage({ csrfToken, user }) {
  const [tab, setTab] = useState("challenges");
  const firstName = user?.full_name?.split(" ")[0] || "Developer";

  return (
    <div className="learn-console">
      <header className="learn-console-top">
        <div className="learn-console-top-inner">
          <div className="learn-console-brand">
            <p className="learn-console-kicker">Reviewer · Training</p>
            <h1 className="learn-console-title">Hey {firstName}</h1>
            <p className="learn-console-sub">
              52 real-world vulnerabilities from bug bounties, CVEs, and actual breaches.
              Read the incident, find the line, lock in the fix.
            </p>
          </div>

          <ul className="learn-spark-deck" aria-label="How training works">
            {LEARN_SPARKS.map((spark) => (
              <li key={spark.title} className="learn-spark">
                <span className="learn-spark-icon" aria-hidden="true" />
                <div className="learn-spark-copy">
                  <p className="learn-spark-title">{spark.title}</p>
                  <p className="learn-spark-body">{spark.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <nav className="learn-console-tabs" role="tablist" aria-label="Training sections">
            {LEARN_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className={`learn-tab ${tab === item.id ? "is-active" : ""}`}
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
              >
                <span className="learn-tab-glyph" aria-hidden="true">{item.glyph}</span>
                <span className="learn-tab-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="learn-console-body">
        {tab === "challenges" ? (
          <div className="learn-workspace-dock">
            <TrainingWorkspace
              mode="training"
              csrfToken={csrfToken}
              heroVariant="minimal"
              title="Vulnerability Lab"
              subtitle="52 real breaches, 9 categories. Pick a challenge, read how it went down in production, then spot the exact line that caused it."
            />
          </div>
        ) : null}
        {tab === "playbooks" ? <PlaybooksPanel /> : null}
        {tab === "squad" ? <SquadPanel csrfToken={csrfToken} /> : null}
      </div>
    </div>
  );
}

export default LearningPage;
