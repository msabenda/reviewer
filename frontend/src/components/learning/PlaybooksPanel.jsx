import { useState } from "react";

import { API_SECURITY_TRACKS } from "../../data/apiSecurityTracks";

/**
 * PR / API review checklists — kept separate from the challenge workspace to reduce noise.
 */
function PlaybooksPanel() {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="playbooks-panel" aria-labelledby="playbooks-title">
      <header className="playbooks-panel-head">
        <h2 id="playbooks-title">Review playbooks</h2>
        <p className="playbooks-panel-lede">
          DevSecOps habit: run the checklist that matches your PR before merge. Expand one track at a
          time.
        </p>
      </header>

      <div className="playbooks-accordion">
        {API_SECURITY_TRACKS.map((track) => {
          const open = openId === track.id;
          return (
            <div key={track.id} className={`playbook-item ${open ? "is-open" : ""}`}>
              <button
                type="button"
                className="playbook-trigger"
                aria-expanded={open}
                onClick={() => setOpenId(open ? "" : track.id)}
              >
                <span className="playbook-chevron" aria-hidden="true">
                  {open ? "▼" : "▶"}
                </span>
                <span className="playbook-title">{track.title}</span>
              </button>
              <p className="playbook-summary">{track.summary}</p>
              {open ? (
                <div className="playbook-body">
                  <h3 className="playbook-checklist-heading">PR checklist</h3>
                  <ol className="playbook-checklist">
                    {track.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PlaybooksPanel;
