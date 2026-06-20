from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "HotspotPay FastAPI Microservice"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    HOST: str = "0.0.0.0"
    PORT: int = 8443

    # URL publique pour la generation de scripts/URLs accessibles par les routeurs
    # Met à jour .env avec PUBLIC_URL=http://<votre-ip-publique>:8444
    PUBLIC_URL: str = ""

    # Individual DB variables — no default password
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "hotspot_fastapi"  # fixed typo: was "hostpot_fastapi"
    DATABASE_URL: str = ""  # sera construit automatiquement
    REDIS_URL: str = "redis://localhost:6379/0"

    LONG_POLL_TIMEOUT: int = 10  # 10s — agent boucle toutes les 5s, pas besoin d'attendre 20s
    LONG_POLL_INTERVAL: float = 0.5

    # Secrets — no defaults, must be set via env
    API_KEY: str = ""
    ROUTER_TOKEN_HEADER: str = "X-Router-Token"

    TICKET_CODE_LENGTH: int = 3
    DEFAULT_HOTSPOT_PROFILE: str = "default"

    JAVA_CALLBACK_URL: str = "http://localhost:8080/internal/router-callback"
    JAVA_CALLBACK_TIMEOUT: float = 5.0
    JAVA_CALLBACK_SECRET: str = ""

    # CORS — comma-separated list of allowed origins, no wildcard
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    def get_public_url(self) -> str:
        """
        Retourne l'URL publique du service pour la generation de scripts.
        Si PUBLIC_URL est definie dans .env, l'utiliser.
        Sinon, construire depuis HOST + PORT.
        """
        if self.PUBLIC_URL:
            return self.PUBLIC_URL.rstrip("/")
        host = "localhost" if self.HOST in ("0.0.0.0", "127.0.0.1") else self.HOST
        scheme = "https" if self.PORT in (443, 8443) else "http"
        return f"{scheme}://{host}:{self.PORT}"


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    # Construire DATABASE_URL a partir des variables separees (evite le probleme @ dans le mot de passe)
    if not s.DATABASE_URL:
        from urllib.parse import quote_plus
        s.DATABASE_URL = (
            f"postgresql+asyncpg://{s.DB_USER}:{quote_plus(s.DB_PASSWORD)}"
            f"@{s.DB_HOST}:{s.DB_PORT}/{s.DB_NAME}"
        )
    return s
