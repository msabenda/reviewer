from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api import api_router
from .core.config import settings
from .core.database import Base, SessionLocal, engine
from .core.schema_migrate import (
    drop_all_tables_for_schema_reset,
    get_sqlite_user_version,
    set_sqlite_user_version,
)
from .middleware import RequestContextMiddleware, SecurityHeadersMiddleware
from .services.challenge_service import ChallengeService


def _users_table_uses_integer_pk() -> bool:
    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return False
    for col in insp.get_columns("users"):
        if col["name"] == "id":
            return "INT" in str(col["type"]).upper()
    return False


def migrate_legacy_integer_user_schema() -> None:
    """One-time rebuild for SQLite DBs created before UUID user PKs (data loss on upgrade)."""
    if not settings.database_url.startswith("sqlite"):
        return
    if _users_table_uses_integer_pk():
        drop_all_tables_for_schema_reset(engine)
    set_sqlite_user_version(engine, max(get_sqlite_user_version(engine), 2))


def ensure_column(table_name: str, column_name: str, definition: str) -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if table_name not in tables:
        return

    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"))


def run_startup_migrations() -> None:
    # Keep older local SQLite files compatible with the current app models.
    ensure_column("users", "role", "VARCHAR(50) NOT NULL DEFAULT 'user'")
    ensure_column("challenges", "file_name", "VARCHAR(255) NOT NULL DEFAULT ''")
    ensure_column("challenges", "code", "TEXT NOT NULL DEFAULT ''")
    ensure_column("challenges", "owasp_tags", "JSON NOT NULL DEFAULT '[]'")
    ensure_column("challenges", "file_tree", "JSON NOT NULL DEFAULT '{}'")
    ensure_column("challenges", "coming_soon", "BOOLEAN NOT NULL DEFAULT 0")
    ensure_column("challenges", "practice_context", "JSON NOT NULL DEFAULT '{}'")


_docs_enabled = settings.environment.lower() == "development"

app = FastAPI(
    title=settings.app_name,
    description="Training backend for secure code review challenges across Web, API, AI, and MCP stacks.",
    version="0.1.0",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextMiddleware)


@app.on_event("startup")
def startup() -> None:
    migrate_legacy_integer_user_schema()
    Base.metadata.create_all(bind=engine)
    run_startup_migrations()
    with SessionLocal() as db:
        ChallengeService.seed_builtin_challenges(db)


@app.get("/")
def index() -> dict[str, str]:
    return {"service": settings.app_name, "docs": "/docs", "api_base": settings.api_v1_prefix}


app.include_router(api_router, prefix=settings.api_v1_prefix)
