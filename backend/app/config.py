from pydantic_settings import BaseSettings, SettingsConfigDict


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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
