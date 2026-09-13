# Contributing to Reviewer

Thanks for helping developers learn secure code review.

## Good Contributions

- Correct or expand defensive remediation guidance.
- Add realistic, self-contained challenges mapped to current OWASP guidance.
- Improve tests, accessibility, documentation, or developer experience.
- Fix application vulnerabilities without removing intentionally vulnerable training snippets.

## Development Workflow

1. Fork the repository and create a focused branch.
2. Keep each pull request limited to one clear change.
3. Never use real credentials, customer data, proprietary code, or live exploit targets.
4. Run the validation commands below.
5. Explain what changed, why it matters, and how it was tested.

```bash
python -m compileall -q backend/app
cd frontend
npm ci
npm run build
```

## Adding a Challenge

A challenge should include:

- a unique, descriptive ID;
- language, framework, difficulty, points, and estimated duration;
- a fictional scenario and intentionally vulnerable snippet;
- exact vulnerable line numbers;
- actionable remediation and progressive hints;
- relevant OWASP Web, API, or LLM tags.

Use fictional organizations and redacted/example credentials. Avoid weaponized instructions that are unnecessary for explaining the risk.

## Commit Style

Use concise imperative subjects, for example:

- `feat(challenges): add OAuth token confusion exercise`
- `fix(api): validate uploaded challenge paths`
- `docs: document local development setup`
- `test(auth): cover expired access tokens`

## Reporting Security Issues

Do not open a public issue for a vulnerability in the platform itself. Follow [`SECURITY.md`](SECURITY.md).
