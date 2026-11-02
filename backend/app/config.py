from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory: d:/karta/backend
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Karta"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # PostgreSQL Database URL using asyncpg driver
    # Format: postgresql+asyncpg://<username>:<password>@<host>:<port>/<dbname>
    # In production, this gets overridden by Neon PostgreSQL connection string from .env
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/karta"

    # Secret key for signing HTTP-only session cookies
    SECRET_KEY: str = "karta_insecure_dev_secret_change_in_production"

    # Email & Client Frontend URLs (Configurable via .env or Admin Settings)
    EMAIL_FROM: str = "Karta Team <noreply@karta.app>"
    FRONTEND_URL: str = "http://localhost:5173"

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://127.0.0.1:8000/api/v1/auth/google/callback"

    # Global Admin Emails (comma-separated, e.g. "raj@karta.dev,admin@karta.dev")
    ADMIN_EMAILS: str = ""

    def is_admin_email(self, email: str) -> bool:
        """Return True if the email is registered in ADMIN_EMAILS."""
        if not self.ADMIN_EMAILS:
            return False
        admin_list = [e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()]
        return email.strip().lower() in admin_list

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
