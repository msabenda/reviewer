from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

Track = Literal["web", "api", "ai", "mcp"]
Difficulty = Literal["Beginner", "Intermediate", "Advanced"]


class ChallengeSummary(BaseModel):
    id: str
    title: str
    track: Track
    category: str
    language: str
    framework: str
    difficulty: Difficulty
    points: int
    duration_minutes: int
    description: str
    owasp_tags: list[str] = Field(default_factory=list)
    coming_soon: bool = False
    is_demo: bool = False
    # SDLC moment, curriculum week, API topics, spaced-repetition note, post-submit teaching (see post_submit_insight).
    practice_context: dict = Field(default_factory=dict)


class ChallengeDetail(ChallengeSummary):
    scenario: str
    file_name: str
    code: str
    file_tree: dict = Field(default_factory=dict)
    vulnerable_lines: list[int]
    remediation: str
    hints: list[str] = Field(default_factory=list)


class CategoryOverview(BaseModel):
    id: str
    title: str
    subtitle: str
    accent: str
    icon: str
    available_count: int
    coming_soon_count: int


class PlatformStats(BaseModel):
    available_now: int
    coming_soon: int
    content_hours: float
    topic_categories: int


class ChallengeCreate(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=255)
    track: Track
    category: str = Field(min_length=1, max_length=100)
    language: str = Field(min_length=1, max_length=50)
    framework: str = Field(min_length=1, max_length=100)
    difficulty: Difficulty
    points: int = Field(gt=0)
    duration_minutes: int = Field(gt=0)
    description: str = Field(min_length=1)
    scenario: str = Field(min_length=1)
    file_name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1)
    vulnerable_lines: list[int]
    hints: list[str] = Field(default_factory=list)
    remediation: str = Field(min_length=1)
    file_tree: dict = Field(default_factory=dict)
    owasp_tags: list[str] = Field(default_factory=list)
    coming_soon: bool = False
    practice_context: dict = Field(default_factory=dict)


class FileTreeNode(BaseModel):
    name: str
    type: str  # "file" or "folder"
    children: list["FileTreeNode"] = Field(default_factory=list)
    content: str = ""  # for files


class AttemptStats(BaseModel):
    total_attempts: int
    successful_attempts: int
    success_rate: float


class SubmissionRequest(BaseModel):
    selected_lines: list[int] = Field(default_factory=list)

    @field_validator("selected_lines")
    @classmethod
    def validate_selected_lines(cls, value: list[int]) -> list[int]:
        if len(value) > 256:
            raise ValueError("Too many selected lines")
        if any(line < 0 or line > 500_000 for line in value):
            raise ValueError("Invalid line numbers")
        return value


class SubmissionResult(BaseModel):
    challenge_id: str
    score: int
    passed: bool
    matched_lines: list[int]
    missed_lines: list[int]
    false_positive_lines: list[int]
    feedback: str
    remediation: str
    attempts: AttemptStats
    post_submit_insight: dict = Field(default_factory=dict)


class SquadPulse(BaseModel):
    """Lightweight squad / org pulse for team-mode dashboards."""

    mission_title: str
    mission_detail: str
    focus_tracks: list[str]
    suggested_challenge_ids: list[str]
    your_passes_last_7_days: int
    org_attempts_last_7_days: int


class RecentAttempt(BaseModel):
    challenge_id: str
    challenge_title: str
    score: int
    passed: bool
    created_at: str


class UserProgress(BaseModel):
    total_attempts: int
    successful_attempts: int
    success_rate: float
    average_score: float
    challenges_completed: int
    recent_attempts: list[RecentAttempt] = Field(default_factory=list)


class LeaderboardEntry(BaseModel):
    rank: int
    full_name: str
    total_attempts: int
    successful_attempts: int
    average_score: float
    success_rate: float
