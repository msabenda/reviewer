import { useState } from "react";

import PlaybooksPanel from "../components/learning/PlaybooksPanel";
import SquadPanel from "../components/learning/SquadPanel";
import TrainingWorkspace from "../components/workspace/TrainingWorkspace";

const LEARN_TABS = [
  { id: "challenges", label: "Challenges", glyph: "◇" },
  { id: "playbooks", label: "Playbooks", glyph: "≡" },
  { id: "squad", label: "Team pulse", glyph: "◎" },
];

const LEARN_SPARKS = [
  {
    title: "SDLC order",
    body: "Challenges follow the same gate sequence many teams use before prod.",
  },
  {
    title: "Mark lines",
    body: "Click only exploitable lines — precision beats guessing in review.",
  },
  {
    title: "Submit to score",
    body: "Instant feedback, remediation, and progress sync to your profile.",
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
            <h1 className="learn-console-title">Hello, {firstName}</h1>
            <p className="learn-console-sub">
              Your workspace is tuned for depth: SDLC-ordered challenges, crisp filters, and a review surface that
              feels like the real PR queue.
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
                <span className="learn-tab-glyph" aria-hidden="true">
                  {item.glyph}
                </span>
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
              title="Challenge workspace"
              subtitle="Pick a challenge, scan the brief and file tree, then flag only the lines you would block in review. Context panels stay collapsed until you need them."
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
