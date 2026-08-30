import os

class Settings:
    PROJECT_NAME: str = "Candidate Sourcing System (TalentBridge)"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "talentbridge-secret-key-super-secure-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Base Directory & Uploads Directory
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    MAX_FILE_SIZE_MB: int = 5

    # Absolute Database URL for reliable access across environments (supports SQLite and PostgreSQL)
    DEFAULT_DB_PATH: str = os.path.join(BASE_DIR, "candidate_sourcing.db").replace("\\", "/")
    _raw_db_url: str = os.getenv("DATABASE_URL", "").strip()

    # Fallback to SQLite if DATABASE_URL is missing or contains placeholder values like 'hostname'
    if not _raw_db_url or "hostname" in _raw_db_url or "username:password" in _raw_db_url:
        DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"
    else:
        DATABASE_URL: str = _raw_db_url.replace("postgres://", "postgresql://", 1) if _raw_db_url.startswith("postgres://") else _raw_db_url

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
