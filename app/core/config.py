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

    # Absolute Database URL for reliable SQLite access across environments
    DEFAULT_DB_PATH: str = os.path.join(BASE_DIR, "candidate_sourcing.db").replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
