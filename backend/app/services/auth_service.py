from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.security import (
    TIMING_DUMMY_PASSWORD_HASH,
    clear_session_cookies,
    create_access_token,
    create_csrf_token,
    hash_password,
    pwd_context,
    set_csrf_cookie,
    set_session_cookie,
    verify_password,
)
from ..models import User
from ..schemas import AuthSessionResponse, RegisterRequest, UserRead


class AuthService:
    @staticmethod
    def register_user(db: Session, payload: RegisterRequest) -> User:
        existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(
            full_name=payload.full_name.strip(),
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> User | None:
        user = db.scalar(select(User).where(User.email == email.lower()))
        hash_for_verify = user.password_hash if user is not None else TIMING_DUMMY_PASSWORD_HASH
        if not verify_password(password, hash_for_verify):
            return None

        if user is None:
            return None

        if pwd_context.needs_update(user.password_hash):
            user.password_hash = hash_password(password)
            db.add(user)
            db.commit()
            db.refresh(user)

        if not user.is_active:
            return None

        return user

    @staticmethod
    def to_user_read(user: User) -> UserRead:
        return UserRead(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )

    def start_session(self, response, user: User) -> AuthSessionResponse:
        access_token = create_access_token(subject=str(user.id))
        csrf_token = create_csrf_token()
        set_session_cookie(response, access_token)
        set_csrf_cookie(response, csrf_token)
        response.headers["Cache-Control"] = "no-store"
        return AuthSessionResponse(user=self.to_user_read(user), csrf_token=csrf_token)

    def to_session_response(self, user: User, csrf_token: str) -> AuthSessionResponse:
        return AuthSessionResponse(user=self.to_user_read(user), csrf_token=csrf_token)

    @staticmethod
    def clear_session(response) -> None:
        clear_session_cookies(response)
        response.headers["Cache-Control"] = "no-store"


auth_service = AuthService()
