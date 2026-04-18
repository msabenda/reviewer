from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.deps import get_current_user
from ....core.config import settings
from ....core.security import create_csrf_token, set_csrf_cookie, validate_csrf
from ....models import User
from ....schemas import AuthSessionResponse, LoginRequest, RegisterRequest
from ....services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    user = auth_service.register_user(db, payload)
    return auth_service.start_session(response, user)


@router.post("/login", response_model=AuthSessionResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    user = auth_service.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return auth_service.start_session(response, user)


@router.get("/me", response_model=AuthSessionResponse)
def me(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
) -> AuthSessionResponse:
    csrf_token = request.cookies.get(settings.csrf_cookie_name) or create_csrf_token()
    set_csrf_cookie(response, csrf_token)
    response.headers["Cache-Control"] = "no-store"
    return auth_service.to_session_response(current_user, csrf_token)


@router.post("/logout")
def logout(request: Request, response: Response) -> dict[str, str]:
    # Prevent CSRF logout when a session cookie exists.
    if request.cookies.get(settings.access_token_cookie_name) and not validate_csrf(request):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token missing or invalid")
    auth_service.clear_session(response)
    return {"message": "Logged out"}
