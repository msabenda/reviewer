# Product roadmap: GitHub, depth, AI, assessment, content packs

This document captures how **reviewer** can connect to **GitHub** and adjacent systems, and how the product can evolve without turning the training app into a second CI platform overnight. Treat phases as priorities, not promises on a fixed date.

---

## 1. GitHub and CI/PR integration (flexibility)

You can integrate at several layers; pick what matches your org’s appetite for tokens, apps, and compliance.

| Approach | What you get | Flexibility / cost |
|----------|----------------|---------------------|
| **GitHub Actions only** | Scheduled or `workflow_dispatch` jobs call reviewer’s HTTP API; post PR/issue comments with `gh` or `actions/github-script`. | Fastest today: repo secrets + **cookie session** (login as a dedicated bot user, then `GET` training routes) — see `docs/samples/reviewer-weekly-mission.yml`. Cleaner next step: **machine API key** or **Bearer JWT** issued for CI without passwords in Actions. |
| **GitHub App** | Installation-scoped tokens, Check Runs, PR annotations, centralized config. | Best for “merge blocked until …” at scale; more engineering up front (webhooks, JWT app auth). |
| **OAuth (“Sign in with GitHub”)** | Users link `github_id` to reviewer accounts; nicer UX than email-only. | Does not by itself enforce CI; combine with App or Actions for gates. |
| **Status context / branch protection** | External system publishes commit status `reviewer/training` (or Check Run). | Reviewer (or a tiny broker) must expose an API keyed by `owner/repo` + `sha` + policy (e.g. min passes this week). |

**Lightweight CI/PR flows (concrete patterns)**

1. **Mission of the week**  
   Action runs weekly (or on `workflow_dispatch`): `GET` squad/mission payload from reviewer → open/update a discussion or pinned issue with copy + deep link to `/learn`.

2. **PR comment nudge**  
   On `pull_request` (opened/sync): optional job posts a short comment linking to the playbook that matches changed paths (e.g. `**/routes/*.py` → API authz checklist). No merge block.

3. **Merge gate (strict)**  
   Branch protection requires a **Check Run** or **commit status** that reviewer (or GitHub App) sets to `success` only when N distinct challenges passed in a time window **for that branch name or PR head SHA** (policy is product-defined). Requires anti-cheat basics (see §4) before employers trust it.

**Repository contract (recommended later)**

- Optional file **`.reviewer.yml`** at repo root: `min_passes`, `track`, `window_days`, `mission_id`.  
- Parser lives in reviewer or in the GitHub App service; version the schema (`reviewer_config_version: 1`).

A **sample** GitHub Actions workflow (manual trigger, optional secrets) lives at `docs/samples/reviewer-weekly-mission.yml`.

---

## 2. Language and framework depth (retention over breadth)

Market expectation is **idiomatic fixes** per stack, not one generic paragraph.

**Near-term**

- Enrich `practice_context.post_submit_insight` and remediation with **stack-specific** “fix pattern” text (FastAPI deps vs Django middleware vs Spring `@PreAuthorize` vs Nest guards vs Go chi middleware).
- Tag challenges with `framework_lanes: ["fastapi"]` and filter learning paths in the UI by lane.

**Medium-term**

- **Curated tracks** (depth): e.g. “FastAPI API security” six challenges, shared checklist, spaced repetition of BOLA/JWT/query-param SSRF across files.
- **Variant seeds**: same vulnerability class, different file layout (multi-file) for “week 4” difficulty.

**Data model direction**

- Keep packs versioned (see §5); optional `locale` or `stack_profile` on packs for copy variants.

---

## 3. AI-assisted learning (careful positioning)

**Principles**

- AI is for **Socratic hints** and **“explain this like I’m reviewing a PR”** (trust boundaries, authz story), **not** for revealing answers (line numbers, exact CWE mapping as a giveaway, or full exploit steps).
- Disclose model use in UI; log prompts/responses minimally for abuse and quality (policy-dependent).

**Product shapes**

- Optional “**Ask a nudge**” button: sends snippet + OWASP tags to an LLM with a system policy that refuses direct answers and returns 2–3 questions.
- **MCP / tool-use** challenges (already in dataset direction): prompt injection, excessive agency, insecure plugins—high interest; keep them clearly labeled as AI-adjacent risk, not “how to hack ChatGPT.”

**Guardrails**

- Rate limits per user; no paste of full solution from model; server-side prompt templates only (no raw user system prompts).

---

## 4. Assessment employers can reference (optional certificate path)

**Goal:** Shareable signal (LinkedIn, interviews) without turning the app into a trivially gameable quiz.

**Building blocks**

1. **Timed attempts** — clock starts on “open challenge”; submit within T minutes; store `started_at`, `submitted_at`.
2. **Randomized variants** — same `pattern_family`, different `challenge_id` / shuffled distractor lines / minor renames (requires variant bank in DB).
3. **No full-solution copy-paste** — UI already line-based; extend with paste detection / blur export in “verified” mode (best-effort, not forensic-grade).
4. **Verified score artifact** — signed JWT or opaque server-issued badge JSON: `{ user_id, challenge_family, passed_at, variant_id }` verifiable with reviewer public key (implement when ready).

**Certificate**

- Optional PDF or hosted page only after **N verified passes** in a track; partner with manual identity verification later if enterprises require it.

---

## 5. Content pipeline (packs, OpenAPI, zip)

**Today:** Admin ZIP upload with `challenge.json` + sources (`backend/app/api/v1/endpoints/admin.py`).

**Double-down checklist**

| Piece | Purpose |
|-------|---------|
| **Pack manifest** | `pack.json`: `name`, `semver`, `changelog`, `author`, `min_reviewer_api`, `default_track`. |
| **Challenge manifest** | Per challenge: `difficulty`, `owasp_api_tags`, `cwe`, `sdlc_phase`, `pattern_family`, `learning_week`. |
| **Changelog** | Human-readable; drives “what’s new” in app and in GitHub release notes for pack repos. |
| **OpenAPI + code zip** | Import flow: diff two OpenAPI specs → suggest new challenges (missing auth, new admin routes); zip attaches handler code for context. |
| **CI for packs** | Lint manifest JSON, validate schema, run smoke import against ephemeral reviewer instance. |

**Quality bar**

- One high-quality pack per month beats ten shallow ones; map every challenge to OWASP API Top 10 / ASVS clause in metadata.

---

## Suggested implementation order

1. **Actions + API** — document secrets, sample workflow, optional read-only `GET` mission endpoint stable for CI.  
2. **Pack versioning + manifest** — extend ZIP contract; reject unknown schema versions.  
3. **Timed + variant attempts** — schema + UI for “verified” mode.  
4. **GitHub OAuth** — login convenience.  
5. **GitHub App + Checks** — merge gates and PR comments at scale.

Questions or contributions: extend this file in PRs with ADR-style snippets when a decision is locked in.
