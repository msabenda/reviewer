from __future__ import annotations

from datetime import UTC, datetime, timedelta
from secrets import compare_digest, token_urlsafe
from typing import Any

from fastapi import Response
from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.requests import Request

from .config import settings

SAFE_HTTP_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
pwd_context = CryptContext(
    schemes=["argon2", "pbkdf2_sha256"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _jwt_signing_key_and_algorithm() -> tuple[str, str]:
    if settings.jwt_use_rs256:
        pem = settings.jwt_rsa_private_key_pem()
        assert pem is not None
        return pem, "RS256"
    return settings.secret_key, "HS512"


def _jwt_verifying_key_and_algorithms() -> tuple[str, list[str]]:
    if settings.jwt_use_rs256:
        pem = settings.jwt_rsa_public_key_pem()
        assert pem is not None
        return pem, ["RS256"]
    return settings.secret_key, ["HS512"]


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "typ": "access",
    }
    key, algorithm = _jwt_signing_key_and_algorithm()
    return jwt.encode(payload, key, algorithm=algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    key, algorithms = _jwt_verifying_key_and_algorithms()
    return jwt.decode(
        token,
        key,
        algorithms=algorithms,
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
        options={"require": ["exp", "iat", "sub", "aud", "iss"]},
    )


def parse_authorization_header(value: str | None) -> str:
    if not value:
        return ""

    scheme, _, token = value.partition(" ")
    if scheme.lower() != "bearer":
        return ""

    return token.strip()


def token_subject(token: str) -> str | None:
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None

    return payload.get("sub")


def create_csrf_token() -> str:
    return token_urlsafe(32)


def set_session_cookie(response: Response, access_token: str) -> None:
    max_age = settings.access_token_expire_minutes * 60
    response.set_cookie(
        key=settings.access_token_cookie_name,
        value=access_token,
        max_age=max_age,
        expires=max_age,
        path="/",
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_samesite,
    )


def set_csrf_cookie(response: Response, csrf_token: str) -> None:
    max_age = settings.access_token_expire_minutes * 60
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=csrf_token,
        max_age=max_age,
        expires=max_age,
        path="/",
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=False,
        samesite=settings.cookie_samesite,
    )


def clear_session_cookies(response: Response) -> None:
    delete_cookie_args = {
        "path": "/",
        "domain": settings.cookie_domain,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
    }
    response.delete_cookie(settings.access_token_cookie_name, **delete_cookie_args)
    response.delete_cookie(settings.csrf_cookie_name, **delete_cookie_args)


def get_request_token(request: Request, authorization: str | None) -> tuple[str, bool]:
    header_token = parse_authorization_header(authorization)
    if header_token:
        return header_token, False

    cookie_token = request.cookies.get(settings.access_token_cookie_name, "").strip()
    return cookie_token, bool(cookie_token)


def validate_csrf(request: Request) -> bool:
    if request.method.upper() in SAFE_HTTP_METHODS:
        return True

    csrf_cookie = request.cookies.get(settings.csrf_cookie_name, "")
    csrf_header = request.headers.get(settings.csrf_header_name, "")

    return bool(csrf_cookie and csrf_header and compare_digest(csrf_cookie, csrf_header))


# Constant-time password check path when the email is unknown (mitigate user enumeration timing).
TIMING_DUMMY_PASSWORD_HASH = hash_password("__reviewer_auth_timing_dummy__v1")
