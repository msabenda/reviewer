/** Canonical SDLC order for challenge lists (Plan → ship). */
export const SDLC_PHASE_ORDER = ["local_dev", "pr_review", "ci_pipeline", "staging", "prod_config"];

/** Maps backend `practice_context.sdlc_phase` to reviewer-facing copy. */
export const SDLC_PHASE_LABEL = {
  local_dev: "Local dev",
  pr_review: "PR review",
  ci_pipeline: "CI",
  staging: "Staging / pre-prod",
  prod_config: "Prod-like config",
};

/** Compact strip labels — same order as `SDLC_PHASE_ORDER`. */
export const SDLC_FLOW = SDLC_PHASE_ORDER.map((id) => ({
  id,
  short: SDLC_PHASE_LABEL[id]?.split(" ")[0] || id,
  label: SDLC_PHASE_LABEL[id] || id,
}));

export function sdlcPhaseLabel(phase) {
  if (!phase) {
    return "";
  }
  return SDLC_PHASE_LABEL[phase] || phase.replace(/_/g, " ");
}

export function sdlcFlowActiveIndex(phase) {
  const i = SDLC_PHASE_ORDER.indexOf(phase);
  return i < 0 ? 0 : i;
}

const DIFF_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };

/** Sort challenges: SDLC phase → curriculum week → difficulty → title. */
export function compareSdlcChallenges(a, b) {
  const ia = SDLC_PHASE_ORDER.indexOf(a.practice_context?.sdlc_phase);
  const ib = SDLC_PHASE_ORDER.indexOf(b.practice_context?.sdlc_phase);
  const na = ia === -1 ? 99 : ia;
  const nb = ib === -1 ? 99 : ib;
  if (na !== nb) {
    return na - nb;
  }
  const wa = Number(a.practice_context?.learning_week) || 0;
  const wb = Number(b.practice_context?.learning_week) || 0;
  if (wa !== wb) {
    return wa - wb;
  }
  const da = DIFF_ORDER[a.difficulty] ?? 9;
  const db = DIFF_ORDER[b.difficulty] ?? 9;
  if (da !== db) {
    return da - db;
  }
  return (a.title || "").localeCompare(b.title || "");
}
