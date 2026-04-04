import os
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import text

from database import SessionLocal

# ── Config ────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "cdss_super_secret_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

router = APIRouter(prefix="/api/auth")
security = HTTPBearer()

# ── Schemas ───────────────────────────────────────────────
class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str  # "doctor", "patient", "admin"

class LoginRequest(BaseModel):
    email: str
    password: str

# ── Helpers ───────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Get current user from token ───────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    return payload

# ── Signup ────────────────────────────────────────────────
@router.post("/signup")
def signup(req: SignupRequest):
    if req.role not in ("doctor", "patient", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'doctor', 'patient' or 'admin'")

    db = SessionLocal()

    # Check if email already exists
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": req.email}
    ).fetchone()

    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username already exists
    existing_username = db.execute(
        text("SELECT id FROM users WHERE username = :username"),
        {"username": req.username}
    ).fetchone()

    if existing_username:
        db.close()
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed = hash_password(req.password)

    db.execute(text("""
        INSERT INTO users (username, email, password_hash, role, created_at)
        VALUES (:username, :email, :password_hash, :role, :created_at)
    """), {
        "username": req.username,
        "email": req.email,
        "password_hash": hashed,
        "role": req.role,
        "created_at": datetime.utcnow()
    })

    db.commit()
    db.close()

    return {"message": "Account created successfully"}

# ── Login ─────────────────────────────────────────────────
@router.post("/login")
def login(req: LoginRequest):
    db = SessionLocal()

    user = db.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": req.email}
    ).fetchone()

    db.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

# ── Get current user info ─────────────────────────────────
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user