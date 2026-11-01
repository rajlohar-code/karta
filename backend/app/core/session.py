from typing import Any
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from app.config import settings

# -----------------------------------------------------------------------------
# Session Security Constants (karta_security.md Layer 1)
# -----------------------------------------------------------------------------
# Name of the HTTP-only cookie transmitted in request headers
SESSION_COOKIE_NAME = "karta_session"

# Expiration period: 7 days in seconds (7 * 24 * 60 * 60 = 604,800 seconds)
SESSION_MAX_AGE = 60 * 60 * 24 * 7

# Cryptographic Salt to namespace session signatures
SESSION_SALT = "karta_user_session_v1"

# The serializer combines HMAC-SHA256 digital signing with timestamp tracking
_serializer = URLSafeTimedSerializer(
    secret_key=settings.SECRET_KEY,
    salt=SESSION_SALT,
)


def sign_session_data(payload: dict[str, Any]) -> str:
    """
    Digitally signs a session dictionary using the server's SECRET_KEY.
    
    ---------------------------------------------------------------------------
    HOW IT WORKS:
    1. Converts `payload` (e.g. {"user_id": 1}) into a URL-safe base64 string.
    2. Computes an HMAC-SHA256 signature using `settings.SECRET_KEY`.
    3. Attaches the current timestamp.
    4. Returns a tamper-proof string: e.g. 'eyJ1c2VyX2lkIjoxfQ.Z...'.
    ---------------------------------------------------------------------------
    """
    return _serializer.dumps(payload)


def verify_session_token(token: str) -> dict[str, Any] | None:
    """
    Verifies the cryptographic seal and expiration of a session token.
    
    ---------------------------------------------------------------------------
    SECURITY CHECKS PERFORMED:
    1. Signature Check : Did anyone tamper with or modify the cookie?
                         If even a single character was altered -> returns None!
    2. Expiration Check: Is the cookie older than 7 days (SESSION_MAX_AGE)?
                         If expired -> returns None!
    3. Returns the original decoded dictionary if 100% valid.
    ---------------------------------------------------------------------------
    """
    if not token:
        return None

    try:
        data = _serializer.loads(token, max_age=SESSION_MAX_AGE)
        return data
    except (BadSignature, SignatureExpired):
        # Tampered signature or expired session
        return None
