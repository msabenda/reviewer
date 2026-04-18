# reviewer - Secure Code Review Training App

Full-stack training platform for developers to practice secure code review across OWASP Web, API, AI, and MCP risk areas.

## Stack
- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy + JWT auth

## Core Flow
1. Landing page (`/`)
2. Demo challenges (`/demo`) without account
3. Register (`/register`)
4. Login (`/login`)
5. Full learning workspace (`/learn`) with authenticated progress
6. Progress dashboard (`/progress`) and team leaderboard (`/leaderboard`)
7. Admin challenge upload (`/admin`) for admin users

## Supported Training Stacks
- PHP
- Laravel
- Django
- Flask
- FastAPI
- Next.js
- React
- NodeJS
- Go
- Java
- Spring Boot
- AI
- MCP

## Backend Architecture (API Gateway Style)
Versioned entrypoint:
- `/api/v1/*`

Gateway routing:
- `/api/v1/health`
- `/api/v1/auth/*`
- `/api/v1/demo/*`
- `/api/v1/training/*`
- `/api/v1/admin/*`

Security features:
- JWT session cookies for frontend auth
- CSRF protection for authenticated write actions
- Password hashing with PBKDF2-SHA256 (`passlib`)
- SQLAlchemy persistence (`users`, `challenge_attempts`)
- Security headers middleware
- Request context logging middleware
- CORS configured via settings

## Project Structure
### Backend
- `backend/app/main.py`: app factory wiring, middleware, router mount
- `backend/app/api/v1/router.py`: API gateway router
- `backend/app/api/v1/endpoints/`: `health.py`, `auth.py`, `demo.py`, `training.py`
- `backend/app/core/`: config, db session, auth deps, JWT/password utilities
- `backend/app/models/`: SQLAlchemy models
- `backend/app/services/`: challenge scoring/filtering and auth service
- `backend/app/schemas/`: pydantic request/response models
- `backend/app/data.py`: challenge dataset

### Frontend
- `frontend/src/App.jsx`: app shell + path-based routing
- `frontend/src/context/AuthContext.jsx`: auth state and token persistence
- `frontend/src/pages/`: landing, demo, auth, learning pages
- `frontend/src/pages/`: landing, demo, auth, learning, progress, leaderboard, admin
- `frontend/src/components/workspace/TrainingWorkspace.jsx`: shared challenge workspace
- `frontend/src/hooks/useReviewerApp.js`: challenge data orchestration for demo/training scopes
- `frontend/src/services/reviewerApi.js`: API client for auth/demo/training endpoints
- `frontend/src/styles/app.css`: modern white/blue/black light/dark theme

## Run Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Default API base URL:
- `http://localhost:8000/api/v1`

Optional environment variables (create `backend/.env`):
- `SECRET_KEY=` long random value (required outside `development`; used for HS512 JWT signing in dev when RSA keys are absent)
- `DATABASE_URL=sqlite:///./reviewer.db`
- `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `JWT_RSA_PRIVATE_KEY_PATH=` and `JWT_RSA_PUBLIC_KEY_PATH=` paths to PEM files (**required outside `development`**) for **RS256** access tokens (asymmetric signing; OWASP-friendly key handling)
- `JWT_ISSUER=reviewer-api` and `JWT_AUDIENCE=reviewer-clients` (defaults match code; tokens include `iss` / `aud` / `iat` / `typ`)

Generate RSA keys (example):
```bash
openssl genrsa -out jwt-rsa-private.pem 2048
openssl rsa -in jwt-rsa-private.pem -pubout -out jwt-rsa-public.pem
```

### Security model (identifiers, JWT, OWASP API 2023 alignment)
- **UUIDs**: `users.id` and `challenge_attempts.id` are UUIDs (string in JSON). `challenges.created_by` is a UUID for admin-authored packs or `null` for platform-seeded challenges.
- **Passwords**: Argon2 (via passlib) for new hashes; existing PBKDF2 hashes still verify and upgrade on login.
- **JWT**: **RS256** when RSA PEM paths are configured; **HS512** + `SECRET_KEY` in development only if PEM paths are omitted. Claims include `iss`, `aud`, `iat`, `exp`, `typ`; validation enforces audience and issuer.
- **Sessions**: HttpOnly access cookie + CSRF double-submit on mutating cookie-authenticated requests; generic errors on failed login with **constant-time** password verification path.
- **Rate limits**: IP-based limits were removed from route decorators because SlowAPI’s wrapper conflicted with FastAPI JSON body binding (422 on login/register/submit). Re-introduce via ASGI middleware or `Depends()`-based limiters that do not wrap the route handler.
- **Payload limits**: `SubmissionRequest` caps selected line count and line index range.
- **SQLite upgrade**: If an older local DB used integer user IDs, startup **drops and recreates** all application tables once (data loss). Use backups or export before upgrading.

OpenAPI `/docs` is **disabled** when `ENVIRONMENT` is not `development` (**API8** reduce exposure).

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend API target defaults to:
- `http://localhost:8000/api/v1`

Override with:
- `VITE_API_BASE_URL`

## API Endpoints
### Public
- `GET /api/v1/health`
- `GET /api/v1/demo/meta`
- `GET /api/v1/demo/categories`
- `GET /api/v1/demo/filters`
- `GET /api/v1/demo/challenges`
- `GET /api/v1/demo/challenges/{challenge_id}`
- `GET /api/v1/demo/challenges/{challenge_id}/stats`
- `POST /api/v1/demo/challenges/{challenge_id}/submit`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Protected (Bearer token required)
- `GET /api/v1/training/meta`
- `GET /api/v1/training/categories`
- `GET /api/v1/training/filters`
- `GET /api/v1/training/challenges`
- `GET /api/v1/training/challenges/{challenge_id}`
- `GET /api/v1/training/challenges/{challenge_id}/stats`
- `POST /api/v1/training/challenges/{challenge_id}/submit`
- `GET /api/v1/training/progress`
- `GET /api/v1/training/squad-pulse`
- `GET /api/v1/training/leaderboard`

### Admin (Admin role + auth required)
- `POST /api/v1/admin/challenges/upload`
- `PUT /api/v1/admin/users/{user_id}/role`

## Roadmap and integrations (GitHub, CI, depth, AI, packs)

Product direction and integration options (GitHub Actions, Apps, OAuth, merge gates, AI guardrails, employer assessment, content pipeline) live in:

- **[docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md)**

A **sample GitHub Actions workflow** (weekly mission → optional issue post) that logs into reviewer and calls `GET /training/squad-pulse`:

- **[docs/samples/reviewer-weekly-mission.yml](docs/samples/reviewer-weekly-mission.yml)**  
  Copy into `.github/workflows/` in a repo where you configure secrets. Prefer a dedicated bot account today; replace with machine-to-machine auth when you implement it (described in the roadmap).

## Notes
- Demo mode uses a curated subset of challenges and in-memory demo attempts.
- Authenticated mode stores attempts in SQLite by default (attempt rows keyed by UUID).
- Admin upload supports `challenge.json` + source files inside ZIP packs.
- Tables are auto-created on backend startup.
- Training routes use **session cookies** (and CSRF on mutating cookie-auth requests); CI integration today uses cookie jar login or future API keys — see roadmap.
