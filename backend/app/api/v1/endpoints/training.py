from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.deps import get_current_user
from ....models import User
from ....schemas import (
    AttemptStats,
    CategoryOverview,
    ChallengeDetail,
    ChallengeSummary,
    LeaderboardEntry,
    PlatformStats,
    SquadPulse,
    UserProgress,
    SubmissionRequest,
    SubmissionResult,
)
from ....services.challenge_service import ChallengeService

router = APIRouter(prefix="/training", tags=["training"])


@router.get("/meta", response_model=PlatformStats)
def get_meta(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> PlatformStats:
    service = ChallengeService(db)
    return service.get_platform_stats(demo_only=False)


@router.get("/categories", response_model=list[CategoryOverview])
def get_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[CategoryOverview]:
    service = ChallengeService(db)
    return service.get_categories(demo_only=False)


@router.get("/filters")
def get_filters(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> dict[str, list[str]]:
    service = ChallengeService(db)
    return {
        "languages": service.list_languages(demo_only=False),
        "difficulties": service.list_difficulties(),
        "tracks": service.list_tracks(),
    }


@router.get("/challenges", response_model=list[ChallengeSummary])
def list_challenges(
    search: str | None = Query(default=None),
    language: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    track: str | None = Query(default=None),
    category: str | None = Query(default=None),
    include_coming_soon: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ChallengeSummary]:
    service = ChallengeService(db)
    return service.list_challenges(
        search=search,
        language=language,
        difficulty=difficulty,
        track=track,
        category=category,
        include_coming_soon=include_coming_soon,
        demo_only=False,
    )


@router.get("/challenges/{challenge_id}", response_model=ChallengeDetail)
def get_challenge(challenge_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> ChallengeDetail:
    service = ChallengeService(db)
    challenge = service.get_challenge(challenge_id, demo_only=False)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return challenge


@router.get("/challenges/{challenge_id}/stats", response_model=AttemptStats)
def get_challenge_stats(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AttemptStats:
    service = ChallengeService(db)
    challenge = service.get_challenge(challenge_id, demo_only=False)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return service.get_attempt_stats(
        challenge_id,
        db=db,
        user_id=current_user.id,
    )


@router.post("/challenges/{challenge_id}/submit", response_model=SubmissionResult)
def submit_challenge(
    challenge_id: str,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubmissionResult:
    service = ChallengeService(db)
    result = service.submit_solution(
        challenge_id,
        payload.selected_lines,
        db=db,
        user_id=current_user.id,
        demo_mode=False,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return result


@router.get("/progress", response_model=UserProgress)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProgress:
    service = ChallengeService(db)
    return service.get_user_progress(current_user.id)


@router.get("/squad-pulse", response_model=SquadPulse)
def get_squad_pulse(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SquadPulse:
    service = ChallengeService(db)
    return service.get_squad_pulse(current_user.id)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(default=25, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LeaderboardEntry]:
    service = ChallengeService(db)
    return service.get_leaderboard(limit=limit)
