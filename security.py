# ============================================================
# ONLINE BANKING - SECURITY
# ============================================================

from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import JWTError, jwt
from pwdlib import PasswordHash

from .database import settings


# ============================================================
# PASSWORD HASHING
# ============================================================

# Argon2 is used by pwdlib's recommended configuration.
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Securely hash a user's password.

    The plain-text password is never stored in the database.
    """

    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against its stored hash.
    """

    try:
        return password_hash.verify(
            password,
            hashed_password,
        )

    except Exception:
        return False


# ============================================================
# JWT CONFIGURATION
# ============================================================

ALGORITHM = "HS256"


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    subject: str,
) -> str:
    """
    Create a JWT access token.

    'subject' normally contains the user's database ID.
    """

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(subject),
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token


# ============================================================
# DECODE ACCESS TOKEN
# ============================================================

def decode_token(
    token: str,
) -> str:
    """
    Decode and validate a JWT.

    Returns the user's ID stored in the 'sub' field.
    """

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        subject = payload.get("sub")

        if subject is None:
            raise ValueError(
                "Token does not contain a subject"
            )

        return str(subject)

    except JWTError as exc:

        raise ValueError(
            "Invalid or expired token"
        ) from exc


# ============================================================
# GENERATE OTP
# ============================================================

def make_otp() -> str:
    """
    Generate a secure six-digit OTP.

    Example:
        482913
    """

    return f"{secrets.randbelow(1_000_000):06d}"


# ============================================================
# HASH OTP
# ============================================================

def hash_otp(
    code: str,
) -> str:
    """
    Hash an OTP before storing it.

    The actual OTP code is never stored in PostgreSQL.
    """

    return hashlib.sha256(
        code.encode("utf-8")
    ).hexdigest()


# ============================================================
# VERIFY OTP
# ============================================================

def verify_otp(
    code: str,
    stored_hash: str,
) -> bool:
    """
    Verify an OTP against its stored SHA-256 hash.
    """

    return secrets.compare_digest(
        hash_otp(code),
        stored_hash,
    )


# ============================================================
# GENERATE RANDOM REFERENCE
# ============================================================

def generate_reference(
    prefix: str = "TXN",
) -> str:
    """
    Generate a unique-looking transaction reference.

    Example:
        TXN-A81F92D4C7E1
    """

    random_part = secrets.token_hex(6).upper()

    return f"{prefix}-{random_part}"


# ============================================================
# GENERATE SECURE RANDOM SECRET
# ============================================================

def generate_secret_key(
    length: int = 48,
) -> str:
    """
    Generate a cryptographically secure random secret.

    Use this to create the SECRET_KEY for your .env file.
    """

    return secrets.token_urlsafe(length)


# ============================================================
# SECURITY CHECK
# ============================================================

def security_status() -> dict:
    """
    Return basic application security configuration status.

    This does not expose the actual secret key.
    """

    secret = settings.SECRET_KEY

    return {
        "jwt_algorithm": ALGORITHM,
        "password_hashing": "Argon2",
        "secret_key_configured": bool(
            secret
            and len(secret) >= 32
        ),
        "token_expiry_minutes": (
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }
