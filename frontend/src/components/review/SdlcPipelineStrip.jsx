import { SDLC_FLOW, sdlcFlowActiveIndex } from "../../constants/sdlc";

/**
 * SSDLC-aligned trace: where this exercise sits (one highlighted step).
 */
function SdlcPipelineStrip({ phase }) {
  const active = sdlcFlowActiveIndex(phase);

  return (
    <div className="sdlc-pipeline-strip" role="list" aria-label="Software delivery lifecycle placement">
      <span className="sdlc-pipeline-label">Where this shows up</span>
      <ol className="sdlc-pipeline-steps">
        {SDLC_FLOW.map((step, index) => (
          <li
            key={step.id}
            className={`sdlc-pipeline-step ${index === active ? "is-current" : ""} ${
              index < active ? "is-past" : ""
            } ${index > active ? "is-future" : ""}`}
            title={step.label}
          >
            <span className="sdlc-pipeline-dot" aria-hidden="true" />
            <span className="sdlc-pipeline-name">{step.short}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default SdlcPipelineStrip;
