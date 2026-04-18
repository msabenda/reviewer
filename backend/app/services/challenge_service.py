from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import ClassVar, Iterable

from sqlalchemy import Integer, func, select
from sqlalchemy.orm import Session

from ..data import CATEGORY_BLUEPRINTS, CHALLENGES, SQUAD_WEEKLY_FOCUS
from ..models import Challenge, ChallengeAttempt, User
from ..schemas import (
    AttemptStats,
    CategoryOverview,
    ChallengeCreate,
    ChallengeDetail,
    ChallengeSummary,
    LeaderboardEntry,
    PlatformStats,
    RecentAttempt,
    SquadPulse,
    SubmissionResult,
    UserProgress,
)

DEMO_CHALLENGE_IDS = {
    "storyforge-php-rce",
    "laravel-mass-assignment",
    "django-report-sqli",
    "flask-file-download",
    "fastapi-token-bola",
    "nextjs-preview-ssrf",
    "react-profile-xss",
    "node-export-command",
    "go-template-traversal",
    "java-search-sqli",
    "springboot-expression-eval",
    "ai-assistant-prompt-injection",
    "mcp-tool-abuse",
}


@dataclass
class AttemptCounter:
    total_attempts: int = 0
    successful_attempts: int = 0


class ChallengeService:
    _demo_attempts: ClassVar[defaultdict[str, AttemptCounter]] = defaultdict(AttemptCounter)

    def __init__(self, db: Session | None = None) -> None:
        self.db = db
        self._challenges: dict[str, ChallengeDetail] = {}

        for item in CHALLENGES:
            payload = {
                **item,
                "file_tree": item.get("file_tree", {}),
                "owasp_tags": item.get("owasp_tags", []),
                "coming_soon": item.get("coming_soon", False),
                "is_demo": item["id"] in DEMO_CHALLENGE_IDS,
            }
            self._challenges[item["id"]] = ChallengeDetail(**payload)

    @classmethod
    def seed_builtin_challenges(cls, db: Session) -> None:
        existing_by_id = {
            challenge.id: challenge
            for challenge in db.scalars(select(Challenge)).all()
        }

        for item in CHALLENGES:
            existing = existing_by_id.get(item["id"])
            if existing is None:
                db.add(
                    Challenge(
                        id=item["id"],
                        title=item["title"],
                        track=item["track"],
                        category=item["category"],
                        language=item["language"],
                        framework=item["framework"],
                        difficulty=item["difficulty"],
                        points=item["points"],
                        duration_minutes=item["duration_minutes"],
                        description=item["description"],
                        scenario=item["scenario"],
                        file_name=item["file_name"],
                        code=item["code"],
                        vulnerable_lines=item["vulnerable_lines"],
                        hints=item.get("hints", []),
                        owasp_tags=item.get("owasp_tags", []),
                        remediation=item["remediation"],
                        file_tree=item.get("file_tree", {}),
                        practice_context=item.get("practice_context", {}),
                        coming_soon=item.get("coming_soon", False),
                        created_by=None,
                    )
                )
                continue

            if existing.created_by is not None:
                continue

            existing.title = item["title"]
            existing.track = item["track"]
            existing.category = item["category"]
            existing.language = item["language"]
            existing.framework = item["framework"]
            existing.difficulty = item["difficulty"]
            existing.points = item["points"]
            existing.duration_minutes = item["duration_minutes"]
            existing.description = item["description"]
            existing.scenario = item["scenario"]
            existing.file_name = item["file_name"]
            existing.code = item["code"]
            existing.vulnerable_lines = item["vulnerable_lines"]
            existing.hints = item.get("hints", [])
            existing.owasp_tags = item.get("owasp_tags", [])
            existing.remediation = item["remediation"]
            existing.file_tree = item.get("file_tree", {})
            existing.practice_context = item.get("practice_context", {})
            existing.coming_soon = item.get("coming_soon", False)

        db.commit()

    def list_challenges(
        self,
        *,
        search: str | None = None,
        language: str | None = None,
        difficulty: str | None = None,
        track: str | None = None,
        category: str | None = None,
        include_coming_soon: bool = False,
        demo_only: bool = False,
    ) -> list[ChallengeSummary]:
        search_value = (search or "").strip().lower()

        if demo_only:
            def matches_demo(challenge: ChallengeDetail) -> bool:
                if not challenge.is_demo:
                    return False
                if not include_coming_soon and challenge.coming_soon:
                    return False
                if language and challenge.language.lower() != language.lower():
                    return False
                if difficulty and challenge.difficulty.lower() != difficulty.lower():
                    return False
                if track and challenge.track.lower() != track.lower():
                    return False
                if category and challenge.category.lower() != category.lower():
                    return False
                if search_value:
                    pc = challenge.practice_context or {}
                    haystack = " ".join(
                        [
                            challenge.title,
                            challenge.description,
                            challenge.language,
                            challenge.framework,
                            " ".join(challenge.owasp_tags),
                            pc.get("sdlc_phase", ""),
                            pc.get("pattern_family", ""),
                            " ".join(pc.get("api_topics") or []),
                        ]
                    ).lower()
                    if search_value not in haystack:
                        return False
                return True

            items = [
                ChallengeSummary(**challenge.model_dump())
                for challenge in self._challenges.values()
                if matches_demo(challenge)
            ]
            return sorted(items, key=lambda item: (-item.points, item.title.lower()))

        self._ensure_builtin_challenges_seeded()
        if self.db is None:
            return []

        challenges = self.db.scalars(select(Challenge)).all()

        def matches_training(challenge: Challenge) -> bool:
            if not include_coming_soon and challenge.coming_soon:
                return False
            if language and challenge.language.lower() != language.lower():
                return False
            if difficulty and challenge.difficulty.lower() != difficulty.lower():
                return False
            if track and challenge.track.lower() != track.lower():
                return False
            if category and challenge.category.lower() != category.lower():
                return False
            if search_value:
                pc = challenge.practice_context or {}
                haystack = " ".join(
                    [
                        challenge.title,
                        challenge.description,
                        challenge.language,
                        challenge.framework,
                        " ".join(challenge.owasp_tags or []),
                        str(pc.get("sdlc_phase", "")),
                        str(pc.get("pattern_family", "")),
                        " ".join(pc.get("api_topics") or []),
                    ]
                ).lower()
                if search_value not in haystack:
                    return False
            return True

        items = [
            ChallengeSummary(
                id=challenge.id,
                title=challenge.title,
                track=challenge.track,
                category=challenge.category,
                language=challenge.language,
                framework=challenge.framework,
                difficulty=challenge.difficulty,
                points=challenge.points,
                duration_minutes=challenge.duration_minutes,
                description=challenge.description,
                owasp_tags=challenge.owasp_tags or [],
                coming_soon=challenge.coming_soon,
                is_demo=challenge.id in DEMO_CHALLENGE_IDS,
                practice_context=challenge.practice_context or {},
            )
            for challenge in challenges
            if matches_training(challenge)
        ]
        return sorted(items, key=lambda item: (-item.points, item.title.lower()))

    def list_languages(self, *, demo_only: bool = False) -> list[str]:
        if not demo_only and self.db is not None:
            self._ensure_builtin_challenges_seeded()
            languages = self.db.scalars(select(Challenge.language).distinct()).all()
            return sorted({language for language in languages if language})

        return sorted(
            {
                challenge.language
                for challenge in self._challenges.values()
                if (not demo_only or challenge.is_demo)
            }
        )

    @staticmethod
    def list_difficulties() -> list[str]:
        return ["Beginner", "Intermediate", "Advanced"]

    @staticmethod
    def list_tracks() -> list[str]:
        return ["web", "api", "ai", "mcp"]

    def get_challenge(self, challenge_id: str, *, demo_only: bool = False) -> ChallengeDetail | None:
        if demo_only:
            challenge = self._challenges.get(challenge_id)
            if challenge is None or not challenge.is_demo:
                return None
            return challenge

        self._ensure_builtin_challenges_seeded()
        if self.db is None:
            return None

        challenge = self.db.scalar(select(Challenge).where(Challenge.id == challenge_id))
        if challenge is None:
            return None

        return ChallengeDetail(
            id=challenge.id,
            title=challenge.title,
            track=challenge.track,
            category=challenge.category,
            language=challenge.language,
            framework=challenge.framework,
            difficulty=challenge.difficulty,
            points=challenge.points,
            duration_minutes=challenge.duration_minutes,
            description=challenge.description,
            scenario=challenge.scenario,
            file_name=challenge.file_name,
            code=challenge.code,
            file_tree=challenge.file_tree or {},
            vulnerable_lines=challenge.vulnerable_lines,
            remediation=challenge.remediation,
            hints=challenge.hints or [],
            owasp_tags=challenge.owasp_tags or [],
            coming_soon=challenge.coming_soon,
            is_demo=challenge.id in DEMO_CHALLENGE_IDS,
            practice_context=challenge.practice_context or {},
        )

    def get_categories(self, *, demo_only: bool = False) -> list[CategoryOverview]:
        if not demo_only and self.db is not None:
            self._ensure_builtin_challenges_seeded()
            challenges = self.db.scalars(select(Challenge)).all()
            available_count_by_category = defaultdict(int)
            coming_soon_count_by_category = defaultdict(int)
            for challenge in challenges:
                if challenge.coming_soon:
                    coming_soon_count_by_category[challenge.category] += 1
                else:
                    available_count_by_category[challenge.category] += 1

            blueprint_by_id = {item["id"]: item for item in CATEGORY_BLUEPRINTS}
            all_categories = sorted(set(available_count_by_category) | set(coming_soon_count_by_category) | set(blueprint_by_id))
            categories: list[CategoryOverview] = []
            for category_id in all_categories:
                blueprint = blueprint_by_id.get(category_id)
                title = blueprint["title"] if blueprint else category_id.replace("-", " ").title()
                subtitle = blueprint["subtitle"] if blueprint else "Custom challenge track"
                accent = blueprint["accent"] if blueprint else "from-blue-500/20 to-cyan-500/20"
                icon = blueprint["icon"] if blueprint else "shield-check"
                categories.append(
                    CategoryOverview(
                        id=category_id,
                        title=title,
                        subtitle=subtitle,
                        accent=accent,
                        icon=icon,
                        available_count=available_count_by_category.get(category_id, 0),
                        coming_soon_count=coming_soon_count_by_category.get(category_id, 0),
                    )
                )
            return categories

        available_count_by_category = defaultdict(int)
        for challenge in self._challenges.values():
            if demo_only and not challenge.is_demo:
                continue
            if challenge.coming_soon:
                continue
            available_count_by_category[challenge.category] += 1

        categories: list[CategoryOverview] = []
        for blueprint in CATEGORY_BLUEPRINTS:
            available = available_count_by_category.get(blueprint["id"], 0)
            coming_soon = 0 if demo_only else max(blueprint["planned_count"] - available, 0)
            categories.append(
                CategoryOverview(
                    id=blueprint["id"],
                    title=blueprint["title"],
                    subtitle=blueprint["subtitle"],
                    accent=blueprint["accent"],
                    icon=blueprint["icon"],
                    available_count=available,
                    coming_soon_count=coming_soon,
                )
            )

        return categories

    def get_platform_stats(self, *, demo_only: bool = False) -> PlatformStats:
        if not demo_only and self.db is not None:
            self._ensure_builtin_challenges_seeded()
            challenges = self.db.scalars(select(Challenge)).all()
            available = [challenge for challenge in challenges if not challenge.coming_soon]
            coming_soon = [challenge for challenge in challenges if challenge.coming_soon]
            categories = {challenge.category for challenge in challenges}
            content_hours = round(sum(challenge.duration_minutes for challenge in available) / 60, 1)
            return PlatformStats(
                available_now=len(available),
                coming_soon=len(coming_soon),
                content_hours=content_hours,
                topic_categories=len(categories),
            )

        available = [
            challenge
            for challenge in self._challenges.values()
            if not challenge.coming_soon and (not demo_only or challenge.is_demo)
        ]
        total_planned = len(available) if demo_only else sum(item["planned_count"] for item in CATEGORY_BLUEPRINTS)
        content_hours = round(sum(challenge.duration_minutes for challenge in available) / 60, 1)

        return PlatformStats(
            available_now=len(available),
            coming_soon=max(total_planned - len(available), 0),
            content_hours=content_hours,
            topic_categories=len(CATEGORY_BLUEPRINTS),
        )

    def get_squad_pulse(self, user_id: str) -> SquadPulse:
        """Org-style pulse: weekly mission copy plus real attempt counts (last 7 days)."""
        if self.db is None:
            return SquadPulse(
                mission_title=SQUAD_WEEKLY_FOCUS["mission_title"],
                mission_detail=SQUAD_WEEKLY_FOCUS["mission_detail"],
                focus_tracks=list(SQUAD_WEEKLY_FOCUS["focus_tracks"]),
                suggested_challenge_ids=list(SQUAD_WEEKLY_FOCUS["suggested_challenge_ids"]),
                your_passes_last_7_days=0,
                org_attempts_last_7_days=0,
            )

        week_ago = datetime.now(UTC) - timedelta(days=7)
        org_attempts = int(
            self.db.scalar(
                select(func.count()).select_from(ChallengeAttempt).where(ChallengeAttempt.created_at >= week_ago)
            )
            or 0
        )
        your_passes = int(
            self.db.scalar(
                select(func.count()).select_from(ChallengeAttempt).where(
                    ChallengeAttempt.user_id == user_id,
                    ChallengeAttempt.created_at >= week_ago,
                    ChallengeAttempt.passed.is_(True),
                )
            )
            or 0
        )

        return SquadPulse(
            mission_title=SQUAD_WEEKLY_FOCUS["mission_title"],
            mission_detail=SQUAD_WEEKLY_FOCUS["mission_detail"],
            focus_tracks=list(SQUAD_WEEKLY_FOCUS["focus_tracks"]),
            suggested_challenge_ids=list(SQUAD_WEEKLY_FOCUS["suggested_challenge_ids"]),
            your_passes_last_7_days=your_passes,
            org_attempts_last_7_days=org_attempts,
        )

    def get_attempt_stats(
        self,
        challenge_id: str,
        *,
        db: Session | None = None,
        user_id: str | None = None,
        demo_mode: bool = False,
    ) -> AttemptStats:
        if db is not None and user_id is not None:
            total_attempts = db.scalar(
                select(func.count()).select_from(ChallengeAttempt).where(
                    ChallengeAttempt.user_id == user_id,
                    ChallengeAttempt.challenge_id == challenge_id,
                )
            )
            successful_attempts = db.scalar(
                select(func.count()).select_from(ChallengeAttempt).where(
                    ChallengeAttempt.user_id == user_id,
                    ChallengeAttempt.challenge_id == challenge_id,
                    ChallengeAttempt.passed.is_(True),
                )
            )

            total_attempts = int(total_attempts or 0)
            successful_attempts = int(successful_attempts or 0)
            success_rate = round((successful_attempts / total_attempts) * 100, 1) if total_attempts else 0.0
            return AttemptStats(
                total_attempts=total_attempts,
                successful_attempts=successful_attempts,
                success_rate=success_rate,
            )

        counter = self._demo_attempts[challenge_id] if demo_mode else AttemptCounter()
        success_rate = round((counter.successful_attempts / counter.total_attempts) * 100, 1) if counter.total_attempts else 0.0

        return AttemptStats(
            total_attempts=counter.total_attempts,
            successful_attempts=counter.successful_attempts,
            success_rate=success_rate,
        )

    def submit_solution(
        self,
        challenge_id: str,
        selected_lines: Iterable[int],
        *,
        db: Session | None = None,
        user_id: str | None = None,
        demo_mode: bool = False,
    ) -> SubmissionResult | None:
        challenge = self.get_challenge(challenge_id, demo_only=demo_mode)
        if challenge is None:
            return None

        expected = set(challenge.vulnerable_lines)
        selected = {line for line in selected_lines if line > 0}

        matched = sorted(expected & selected)
        missed = sorted(expected - selected)
        false_positives = sorted(selected - expected)

        precision = len(matched) / max(len(selected), 1)
        recall = len(matched) / max(len(expected), 1)

        raw_score = (recall * 0.65 + precision * 0.35) * 100 - (len(false_positives) * 8)
        score = max(0, min(100, round(raw_score)))
        passed = recall == 1 and precision >= 0.8 and score >= 80

        if db is not None and user_id is not None:
            attempt = ChallengeAttempt(
                user_id=user_id,
                challenge_id=challenge_id,
                selected_lines=sorted(selected),
                score=score,
                passed=passed,
                matched_lines=matched,
                missed_lines=missed,
                false_positive_lines=false_positives,
            )
            db.add(attempt)
            db.commit()
            attempts = self.get_attempt_stats(challenge_id, db=db, user_id=user_id)
        else:
            counter = self._demo_attempts[challenge_id] if demo_mode else AttemptCounter()
            counter.total_attempts += 1
            if passed:
                counter.successful_attempts += 1
            if demo_mode:
                self._demo_attempts[challenge_id] = counter
            attempts = self.get_attempt_stats(challenge_id, demo_mode=demo_mode)

        feedback = self._build_feedback(passed, matched, missed, false_positives)

        pc = challenge.practice_context or {}
        insight = pc.get("post_submit_insight") if isinstance(pc, dict) else None
        post_submit_insight = insight if isinstance(insight, dict) else {}

        return SubmissionResult(
            challenge_id=challenge_id,
            score=score,
            passed=passed,
            matched_lines=matched,
            missed_lines=missed,
            false_positive_lines=false_positives,
            feedback=feedback,
            remediation=challenge.remediation,
            attempts=attempts,
            post_submit_insight=post_submit_insight,
        )

    def create_challenge(self, challenge_data: ChallengeCreate, created_by: str) -> Challenge:
        challenge = Challenge(
            id=challenge_data.id,
            title=challenge_data.title,
            track=challenge_data.track,
            category=challenge_data.category,
            language=challenge_data.language,
            framework=challenge_data.framework,
            difficulty=challenge_data.difficulty,
            points=challenge_data.points,
            duration_minutes=challenge_data.duration_minutes,
            description=challenge_data.description,
            scenario=challenge_data.scenario,
            file_name=challenge_data.file_name,
            code=challenge_data.code,
            vulnerable_lines=challenge_data.vulnerable_lines,
            hints=challenge_data.hints,
            owasp_tags=challenge_data.owasp_tags,
            remediation=challenge_data.remediation,
            file_tree=challenge_data.file_tree,
            practice_context=challenge_data.practice_context or {},
            coming_soon=challenge_data.coming_soon,
            created_by=created_by,
        )
        self.db.add(challenge)
        self.db.commit()
        self.db.refresh(challenge)
        return challenge

    def get_user_progress(self, user_id: str, *, limit: int = 8) -> UserProgress:
        if self.db is None:
            return UserProgress(
                total_attempts=0,
                successful_attempts=0,
                success_rate=0.0,
                average_score=0.0,
                challenges_completed=0,
                recent_attempts=[],
            )

        total_attempts = int(
            self.db.scalar(
                select(func.count()).select_from(ChallengeAttempt).where(ChallengeAttempt.user_id == user_id)
            )
            or 0
        )
        successful_attempts = int(
            self.db.scalar(
                select(func.count()).select_from(ChallengeAttempt).where(
                    ChallengeAttempt.user_id == user_id,
                    ChallengeAttempt.passed.is_(True),
                )
            )
            or 0
        )
        average_score = float(
            self.db.scalar(
                select(func.avg(ChallengeAttempt.score)).where(ChallengeAttempt.user_id == user_id)
            )
            or 0.0
        )
        completed = int(
            self.db.scalar(
                select(func.count(func.distinct(ChallengeAttempt.challenge_id))).where(
                    ChallengeAttempt.user_id == user_id,
                    ChallengeAttempt.passed.is_(True),
                )
            )
            or 0
        )
        success_rate = round((successful_attempts / total_attempts) * 100, 1) if total_attempts else 0.0

        recent_rows = self.db.execute(
            select(ChallengeAttempt, Challenge.title)
            .join(Challenge, Challenge.id == ChallengeAttempt.challenge_id)
            .where(ChallengeAttempt.user_id == user_id)
            .order_by(ChallengeAttempt.created_at.desc())
            .limit(limit)
        ).all()

        recent_attempts = [
            RecentAttempt(
                challenge_id=attempt.challenge_id,
                challenge_title=title,
                score=attempt.score,
                passed=attempt.passed,
                created_at=attempt.created_at.isoformat(),
            )
            for attempt, title in recent_rows
        ]

        return UserProgress(
            total_attempts=total_attempts,
            successful_attempts=successful_attempts,
            success_rate=success_rate,
            average_score=round(average_score, 1),
            challenges_completed=completed,
            recent_attempts=recent_attempts,
        )

    def get_leaderboard(self, *, limit: int = 25) -> list[LeaderboardEntry]:
        if self.db is None:
            return []

        rows = self.db.execute(
            select(
                User.id,
                User.full_name,
                func.count(ChallengeAttempt.id).label("total_attempts"),
                func.sum(func.cast(ChallengeAttempt.passed, Integer)).label("successful_attempts"),
                func.avg(ChallengeAttempt.score).label("average_score"),
            )
            .join(ChallengeAttempt, ChallengeAttempt.user_id == User.id)
            .group_by(User.id, User.full_name)
            .order_by(
                func.avg(ChallengeAttempt.score).desc(),
                func.sum(func.cast(ChallengeAttempt.passed, Integer)).desc(),
                func.count(ChallengeAttempt.id).desc(),
            )
            .limit(limit)
        ).all()

        leaderboard: list[LeaderboardEntry] = []
        for index, row in enumerate(rows, start=1):
            total_attempts = int(row.total_attempts or 0)
            successful_attempts = int(row.successful_attempts or 0)
            success_rate = round((successful_attempts / total_attempts) * 100, 1) if total_attempts else 0.0
            leaderboard.append(
                LeaderboardEntry(
                    rank=index,
                    full_name=row.full_name,
                    total_attempts=total_attempts,
                    successful_attempts=successful_attempts,
                    average_score=round(float(row.average_score or 0.0), 1),
                    success_rate=success_rate,
                )
            )

        return leaderboard

    @staticmethod
    def _build_feedback(
        passed: bool,
        matched_lines: list[int],
        missed_lines: list[int],
        false_positive_lines: list[int],
    ) -> str:
        if passed:
            return "Excellent review. You identified the vulnerable path with strong precision."

        messages = []
        if matched_lines:
            messages.append(f"Good catch on lines {', '.join(str(line) for line in matched_lines)}.")
        if missed_lines:
            messages.append(f"You missed vulnerable lines: {', '.join(str(line) for line in missed_lines)}.")
        if false_positive_lines:
            messages.append(
                "Some selected lines are not vulnerable: "
                f"{', '.join(str(line) for line in false_positive_lines)}. Focus on exploitability evidence."
            )

        if not messages:
            return "No vulnerable lines selected yet. Start by tracing untrusted input to sensitive operations."

        return " ".join(messages)

    def _ensure_builtin_challenges_seeded(self) -> None:
        if self.db is None:
            return

        challenge_count = self.db.scalar(select(func.count()).select_from(Challenge))
        if challenge_count:
            return

        self.seed_builtin_challenges(self.db)
