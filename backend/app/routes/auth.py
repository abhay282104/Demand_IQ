import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
import bcrypt
from pymongo.database import Database

from app.config import settings
from app.database import get_db
from app.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserResponse,
    TokenResponse,
    PredictionHistoryItem,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ─── Helpers ─────────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode('utf-8')[:72], salt).decode('utf-8')


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8')[:72], hashed.encode('utf-8'))


def _create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except JWTError:
        return None


def _user_to_response(doc: dict) -> UserResponse:
    return UserResponse(
        id=str(doc["_id"]),
        username=doc["username"],
        email=doc["email"],
        full_name=doc.get("full_name"),
        created_at=doc["created_at"],
    )


# ─── Auth Dependency ─────────────────────────────────────────────────────────

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Database = Depends(get_db),
) -> dict:
    token = credentials.credentials
    user_id = _decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    try:
        doc = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return doc


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegisterRequest, db: Database = Depends(get_db)):
    """Register a new user."""
    if db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    doc = {
        "username": body.username,
        "email": body.email.lower(),
        "password_hash": _hash_password(body.password),
        "full_name": body.full_name,
        "created_at": datetime.utcnow(),
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = _create_access_token(str(result.inserted_id))
    return TokenResponse(access_token=token, user=_user_to_response(doc))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLoginRequest, db: Database = Depends(get_db)):
    """Authenticate and get a JWT token."""
    doc = db.users.find_one({"email": body.email.lower()})
    if not doc or not _verify_password(body.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_access_token(str(doc["_id"]))
    return TokenResponse(access_token=token, user=_user_to_response(doc))


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: Database = Depends(get_db)):
    """Generate a password-reset token (returned directly; integrate email service as needed)."""
    doc = db.users.find_one({"email": body.email.lower()})
    if not doc:
        # Don't reveal whether email exists
        return {"message": "If that email is registered, a reset token has been sent."}

    reset_token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    db.users.update_one(
        {"_id": doc["_id"]},
        {"$set": {"reset_token": reset_token, "reset_token_expires": expires}},
    )
    # In production, email this token. For now we return it directly.
    return {
        "message": "Password reset token generated.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: Database = Depends(get_db)):
    """Reset password using a valid reset token."""
    doc = db.users.find_one({"reset_token": body.token})
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if doc.get("reset_token_expires") and datetime.utcnow() > doc["reset_token_expires"]:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    db.users.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {"password_hash": _hash_password(body.new_password)},
            "$unset": {"reset_token": "", "reset_token_expires": ""},
        },
    )
    return {"message": "Password reset successfully. Please log in."}


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    return _user_to_response(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """Update profile fields."""
    updates: dict = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.username is not None:
        conflict = db.users.find_one(
            {"username": body.username, "_id": {"$ne": current_user["_id"]}}
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = body.username

    if updates:
        db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})
        current_user.update(updates)

    return _user_to_response(current_user)


@router.get("/history")
async def get_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """Get prediction history for the authenticated user."""
    docs = list(
        db.predictions.find({"user_id": str(current_user["_id"])})
        .sort("timestamp", -1)
        .limit(limit)
    )
    items = []
    for doc in docs:
        items.append(
            PredictionHistoryItem(
                id=str(doc["_id"]),
                product_id=doc.get("product_id", 0),
                store_id=doc.get("store_id", 0),
                predicted_demand=doc.get("predicted_demand", 0),
                confidence=doc.get("confidence", 0),
                input_price=doc.get("input_price", 0),
                input_promotion=bool(doc.get("input_promotion", False)),
                input_holiday=bool(doc.get("input_holiday", False)),
                input_economic_index=doc.get("input_economic_index", 0),
                model_version=doc.get("model_version"),
                timestamp=doc.get("timestamp", datetime.utcnow()),
            )
        )
    return items
