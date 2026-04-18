from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ....schemas import (
    AttemptStats,
    CategoryOverview,
    ChallengeDetail,
    ChallengeSummary,
    PlatformStats,
    SubmissionRequest,
    SubmissionResult,
)
from ....services.challenge_service import ChallengeService

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/meta", response_model=PlatformStats)
def get_meta() -> PlatformStats:
    service = ChallengeService()
    return service.get_platform_stats(demo_only=True)


@router.get("/categories", response_model=list[CategoryOverview])
def get_categories() -> list[CategoryOverview]:
    service = ChallengeService()
    return service.get_categories(demo_only=True)


@router.get("/filters")
def get_filters() -> dict[str, list[str]]:
    service = ChallengeService()
    return {
        "languages": service.list_languages(demo_only=True),
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
) -> list[ChallengeSummary]:
    service = ChallengeService()
    return service.list_challenges(
        search=search,
        language=language,
        difficulty=difficulty,
        track=track,
        category=category,
        include_coming_soon=include_coming_soon,
        demo_only=True,
    )


@router.get("/challenges/{challenge_id}", response_model=ChallengeDetail)
def get_challenge(challenge_id: str) -> ChallengeDetail:
    service = ChallengeService()
    challenge = service.get_challenge(challenge_id, demo_only=True)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return challenge


@router.get("/challenges/{challenge_id}/stats", response_model=AttemptStats)
def get_challenge_stats(challenge_id: str) -> AttemptStats:
    service = ChallengeService()
    challenge = service.get_challenge(challenge_id, demo_only=True)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return service.get_attempt_stats(challenge_id, demo_mode=True)


@router.post("/challenges/{challenge_id}/submit", response_model=SubmissionResult)
def submit_challenge(challenge_id: str, payload: SubmissionRequest) -> SubmissionResult:
    service = ChallengeService()
    result = service.submit_solution(
        challenge_id,
        payload.selected_lines,
        demo_mode=True,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return result
