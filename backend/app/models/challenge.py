from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String(120), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    track: Mapped[str] = mapped_column(String(50))  # web, api, ai, mcp
    category: Mapped[str] = mapped_column(String(100))
    language: Mapped[str] = mapped_column(String(50))
    framework: Mapped[str] = mapped_column(String(100))
    difficulty: Mapped[str] = mapped_column(String(50))  # Beginner, Intermediate, Advanced
    points: Mapped[int] = mapped_column(Integer)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)
    scenario: Mapped[str] = mapped_column(Text)
    file_name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(Text)
    vulnerable_lines: Mapped[list[int]] = mapped_column(JSON)  # lines with vulnerabilities
    hints: Mapped[list[str]] = mapped_column(JSON)
    owasp_tags: Mapped[list[str]] = mapped_column(JSON)
    remediation: Mapped[str] = mapped_column(Text)
    file_tree: Mapped[dict] = mapped_column(JSON, default=dict)  # folder structure
    practice_context: Mapped[dict] = mapped_column(JSON, default=dict)  # SDLC phase, week, insights
    coming_soon: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)  # admin user UUID; null = platform seed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    attempts: Mapped[list["ChallengeAttempt"]] = relationship(
        back_populates="challenge",
        cascade="all, delete-orphan",
    )
