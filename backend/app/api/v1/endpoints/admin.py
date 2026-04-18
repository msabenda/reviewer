from __future__ import annotations

import json
import shutil
import tempfile
import zipfile
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.deps import get_admin_user
from ....models import Challenge, User
from ....schemas.challenge import ChallengeCreate
from ....services.challenge_service import ChallengeService

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_ARCHIVE_BYTES = 10 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
MAX_ARCHIVE_ENTRIES = 250


def _validate_archive(zip_ref: zipfile.ZipFile) -> None:
    members = zip_ref.infolist()
    if not members:
        raise HTTPException(status_code=400, detail="ZIP archive is empty")
    if len(members) > MAX_ARCHIVE_ENTRIES:
        raise HTTPException(status_code=400, detail="ZIP archive contains too many files")

    uncompressed_size = 0
    for member in members:
        member_path = Path(member.filename)
        if member.is_dir():
            continue
        if member_path.is_absolute() or ".." in member_path.parts:
            raise HTTPException(status_code=400, detail="ZIP contains unsafe file paths")
        uncompressed_size += member.file_size
        if uncompressed_size > MAX_UNCOMPRESSED_BYTES:
            raise HTTPException(status_code=400, detail="ZIP archive is too large when extracted")


def _resolve_nested_path(base_dir: Path, expected_name: str) -> Path | None:
    direct = base_dir / expected_name
    if direct.exists():
        return direct

    nested = list(base_dir.glob(f"*/{expected_name}"))
    if len(nested) == 1 and nested[0].exists():
        return nested[0]
    return None


@router.post("/challenges/upload")
def upload_challenge(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> dict:
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed")

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded ZIP is empty")
    if len(data) > MAX_ARCHIVE_BYTES:
        raise HTTPException(status_code=400, detail="Uploaded ZIP exceeds allowed size")

    with tempfile.TemporaryDirectory(prefix=f"reviewer-admin-{str(current_user.id)[:8]}-") as temp_root:
        archive_path = Path(temp_root) / "challenge.zip"
        extract_path = Path(temp_root) / "extracted"
        archive_path.write_bytes(data)
        extract_path.mkdir(parents=True, exist_ok=True)

        try:
            with zipfile.ZipFile(archive_path, "r") as zip_ref:
                _validate_archive(zip_ref)
                zip_ref.extractall(extract_path)
        except zipfile.BadZipFile as exc:
            raise HTTPException(status_code=400, detail="Invalid ZIP archive") from exc

        challenge_json_path = _resolve_nested_path(extract_path, "challenge.json")
        if challenge_json_path is None:
            raise HTTPException(status_code=400, detail="challenge.json not found in ZIP")

        try:
            challenge_data = json.loads(challenge_json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="challenge.json is not valid JSON") from exc

        try:
            challenge_create = ChallengeCreate(**challenge_data)
        except ValidationError as exc:
            raise HTTPException(status_code=400, detail=f"challenge.json validation failed: {exc.errors()}") from exc
        existing = db.get(Challenge, challenge_create.id)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Challenge id already exists")

        service = ChallengeService(db)
        challenge = service.create_challenge(challenge_create, str(current_user.id))

        challenges_dir = Path(__file__).resolve().parents[4] / "uploaded_challenges"
        challenges_dir.mkdir(exist_ok=True)
        challenge_dir = challenges_dir / challenge.id
        if challenge_dir.exists():
            shutil.rmtree(challenge_dir)
        shutil.copytree(extract_path, challenge_dir)

    return {"challenge_id": challenge.id, "message": "Challenge uploaded successfully"}


@router.put("/users/{user_id}/role")
def set_user_role(
    user_id: UUID,
    role: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> dict:
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.get(User, str(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()

    return {"message": f"User role updated to {role}"}
