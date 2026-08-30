from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# ============================================================
# APPLICATION SETTINGS
# ============================================================

class Settings(BaseSettings):
    DATABASE_URL: str = (
        "postgresql+psycopg://"
        "banking_user:"
        "banking_password@"
        "localhost:5432/"
        "online_banking"
    )

    SECRET_KEY: str = (
        "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --------------------------------------------------------
    # ADMIN
    # --------------------------------------------------------

    ADMIN_EMAIL: str = "admin@example.com"

    ADMIN_PASSWORD: str = "change-this-password"

    # --------------------------------------------------------
    # SMTP / EMAIL
    # --------------------------------------------------------

    SMTP_HOST: str = ""

    SMTP_PORT: int = 587

    SMTP_USERNAME: str = ""

    SMTP_PASSWORD: str = ""

    SMTP_FROM: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    future=True,
)


# ============================================================
# DATABASE SESSION
# ============================================================

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


# ============================================================
# SQLALCHEMY BASE
# ============================================================

class Base(DeclarativeBase):
    pass


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    """
    Creates a database session for an API request.

    The session is always closed after the request finishes.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

def test_database_connection():
    """
    Test whether PostgreSQL is reachable.
    """

    try:

        with engine.connect() as connection:

            connection.exec_driver_sql(
                "SELECT 1"
            )

        return True

    except Exception as exc:

        print(
            f"❌ Database connection failed: {exc}"
        )

        return False


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

def init_db():
    """
    Create all SQLAlchemy tables.

    The actual table definitions are located in models.py.
    """

    try:

        # Import models here so SQLAlchemy knows about them
        # before create_all() runs.
        from . import models  # noqa: F401

        Base.metadata.create_all(
            bind=engine
        )

        print(
            "✅ PostgreSQL database initialized"
        )

        return True

    except Exception as exc:

        print(
            f"❌ Database initialization failed: {exc}"
        )

        raise


# ============================================================
# CLOSE DATABASE
# ============================================================

def close_db():
    """
    Dispose of the SQLAlchemy connection pool.
    """

    try:

        engine.dispose()

        print(
            "✅ Database connections closed"
        )

    except Exception as exc:

        print(
            f"⚠️ Database shutdown warning: {exc}"
        )
