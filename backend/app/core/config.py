from __future__ import annotations

from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "reviewer API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # Symmetric fallback when RSA keys are not configured (dev only recommended).
    secret_key: str = Field(default="change-me-in-production-reviewer-secret-key")
    jwt_algorithm: str = "HS512"
    jwt_issuer: str = "reviewer-api"
    jwt_audience: str = "reviewer-clients"
    jwt_rsa_private_key_path: Path | None = None
    jwt_rsa_public_key_path: Path | None = None
    access_token_expire_minutes: int = 60

    database_url: str = "sqlite:///./reviewer.db"
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    allowed_hosts: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["localhost", "127.0.0.1", "testserver"]
    )
    cors_allow_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$"
    cors_allow_methods: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )
    cors_allow_headers: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"]
    )

    access_token_cookie_name: str = "reviewer_session"
    csrf_cookie_name: str = "reviewer_csrf"
    csrf_header_name: str = "X-CSRF-Token"
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_secure: bool = False
    cookie_domain: str | None = None

    @field_validator("allowed_origins", "allowed_hosts", "cors_allow_methods", "cors_allow_headers", mode="before")
    @classmethod
    def parse_csv_list(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if self.environment.lower() != "development" and self.secret_key == "change-me-in-production-reviewer-secret-key":
            raise ValueError("SECRET_KEY must be set to a unique value outside development")

        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("COOKIE_SECURE must be true when COOKIE_SAMESITE is 'none'")

        if self.environment.lower() != "development":
            if not self.jwt_rsa_private_key_path or not self.jwt_rsa_public_key_path:
                raise ValueError(
                    "JWT_RSA_PRIVATE_KEY_PATH and JWT_RSA_PUBLIC_KEY_PATH must be set outside development "
                    "(RS256 signing required)."
                )
            if not self.jwt_rsa_private_key_path.is_file() or not self.jwt_rsa_public_key_path.is_file():
                raise ValueError("JWT RSA key paths must point to existing PEM files.")

        if self.environment.lower() == "development":
            # Permit LAN/dev-host access for API gateway testing without manual host updates.
            if "*" not in self.allowed_hosts:
                self.allowed_hosts = [*self.allowed_hosts, "*"]

        return self

    def jwt_rsa_private_key_pem(self) -> str | None:
        if self.jwt_rsa_private_key_path and self.jwt_rsa_private_key_path.is_file():
            return self.jwt_rsa_private_key_path.read_text(encoding="utf-8")
        return None

    def jwt_rsa_public_key_pem(self) -> str | None:
        if self.jwt_rsa_public_key_path and self.jwt_rsa_public_key_path.is_file():
            return self.jwt_rsa_public_key_path.read_text(encoding="utf-8")
        return None

    @property
    def jwt_use_rs256(self) -> bool:
        return bool(self.jwt_rsa_private_key_pem() and self.jwt_rsa_public_key_pem())


settings = Settings()
