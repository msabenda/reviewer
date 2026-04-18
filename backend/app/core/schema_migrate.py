from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from .database import Base


def _users_id_is_integer_legacy(engine: Engine) -> bool:
    """Detect pre-UUID SQLite schema (integer user PK) so we can rebuild tables safely."""
    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return False
    for col in insp.get_columns("users"):
        if col["name"] == "id":
            t = str(col["type"]).upper()
            return "INT" in t
    return False


def drop_all_tables_for_schema_reset(engine: Engine) -> None:
    Base.metadata.drop_all(bind=engine)


def set_sqlite_user_version(engine: Engine, version: int) -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.begin() as conn:
        conn.execute(text(f"PRAGMA user_version = {version}"))


def get_sqlite_user_version(engine: Engine) -> int:
    if not str(engine.url).startswith("sqlite"):
        return 0
    with engine.connect() as conn:
        return int(conn.execute(text("PRAGMA user_version")).scalar() or 0)
