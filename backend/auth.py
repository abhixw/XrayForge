# import os
# from datetime import datetime, timedelta

# import bcrypt
# from fastapi import APIRouter, HTTPException, Depends
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import JWTError, jwt
# from pydantic import BaseModel
# from sqlalchemy import text

# from database import SessionLocal

# # ── Config ────────────────────────────────────────────────
# SECRET_KEY = os.getenv("SECRET_KEY", "cdss_super_secret_key_2026")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_HOURS = 24

# router = APIRouter(prefix="/api/auth")
# security = HTTPBearer()

# # ── Schemas ───────────────────────────────────────────────
# class SignupRequest(BaseModel):
#     username: str
#     email: str
#     password: str
#     role: str  # "doctor", "patient", "admin"

# class LoginRequest(BaseModel):
#     email: str
#     password: str

# # ── Helpers ───────────────────────────────────────────────
# def hash_password(password: str) -> str:
#     return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# def verify_password(password: str, hashed: str) -> bool:
#     return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

# def create_token(data: dict) -> str:
#     payload = data.copy()
#     payload["exp"] = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
#     return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# def decode_token(token: str) -> dict:
#     try:
#         return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid or expired token")

# # ── Get current user from token ───────────────────────────
# def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     token = credentials.credentials
#     payload = decode_token(token)
#     return payload

# # ── Signup ────────────────────────────────────────────────
# @router.post("/signup")
# def signup(req: SignupRequest):
#     if req.role not in ("doctor", "patient", "admin"):
#         raise HTTPException(status_code=400, detail="Role must be 'doctor', 'patient' or 'admin'")

#     db = SessionLocal()

#     # Check if email already exists
#     existing = db.execute(
#         text("SELECT id FROM users WHERE email = :email"),
#         {"email": req.email}
#     ).fetchone()

#     if existing:
#         db.close()
#         raise HTTPException(status_code=400, detail="Email already registered")

#     # Check if username already exists
#     existing_username = db.execute(
#         text("SELECT id FROM users WHERE username = :username"),
#         {"username": req.username}
#     ).fetchone()

#     if existing_username:
#         db.close()
#         raise HTTPException(status_code=400, detail="Username already taken")

#     hashed = hash_password(req.password)

#     db.execute(text("""
#         INSERT INTO users (username, email, password_hash, role, created_at)
#         VALUES (:username, :email, :password_hash, :role, :created_at)
#     """), {
#         "username": req.username,
#         "email": req.email,
#         "password_hash": hashed,
#         "role": req.role,
#         "created_at": datetime.utcnow()
#     })

#     db.commit()
#     db.close()

#     return {"message": "Account created successfully"}

# # ── Login ─────────────────────────────────────────────────
# @router.post("/login")
# def login(req: LoginRequest):
#     db = SessionLocal()

#     user = db.execute(
#         text("SELECT * FROM users WHERE email = :email"),
#         {"email": req.email}
#     ).fetchone()

#     db.close()

#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid email or password")

#     if not verify_password(req.password, user.password_hash):
#         raise HTTPException(status_code=401, detail="Invalid email or password")

#     token = create_token({
#         "user_id": user.id,
#         "username": user.username,
#         "email": user.email,
#         "role": user.role
#     })

#     return {
#         "access_token": token,
#         "token_type": "bearer",
#         "user": {
#             "id": user.id,
#             "username": user.username,
#             "email": user.email,
#             "role": user.role
#         }
#     }

# # ── Get current user info ─────────────────────────────────
# @router.get("/me")
# def get_me(current_user: dict = Depends(get_current_user)):
#     return current_user


import os
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import text
from jose import jwt, JWTError
import bcrypt
 
from database import SessionLocal
 
SECRET_KEY = os.getenv("SECRET_KEY", "cdss_super_secret_key_2026")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24
 
router = APIRouter()
security = HTTPBearer()
 
# In-memory OTP store: { phone: { otp, patient_id, expires } }
otp_store = {}
 
 
# ── MODELS ──────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "doctor" or "admin"
 
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str
 
class PatientOTPRequest(BaseModel):
    name: str
    patient_id: str
    phone: str
 
class PatientVerifyOTPRequest(BaseModel):
    phone: str
    otp: str
 
 
# ── HELPERS ─────────────────────────────────────────
def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
 
 
def get_current_user(credentials: HTTPAuthorizationCredentials) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
 
 
# ── DOCTOR / ADMIN SIGNUP ────────────────────────────
@router.post("/api/auth/signup")
def signup(req: SignupRequest):
    if req.role not in ("doctor", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'doctor' or 'admin'")
 
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
 
    db = SessionLocal()
    try:
        existing = db.execute(
            text("SELECT id FROM users WHERE email = :email"), {"email": req.email}
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
 
        db.execute(text("""
            INSERT INTO users (name, email, password_hash, role, created_at)
            VALUES (:name, :email, :password_hash, :role, :created_at)
        """), {
            "name": req.name.strip(),
            "email": req.email.strip().lower(),
            "password_hash": hashed,
            "role": req.role,
            "created_at": datetime.utcnow()
        })
        db.commit()
        return {"message": "Account created successfully"}
    finally:
        db.close()
 
 
# ── DOCTOR / ADMIN LOGIN ─────────────────────────────
@router.post("/api/auth/login")
def login(req: LoginRequest):
    db = SessionLocal()
    try:
        row = db.execute(
            text("SELECT * FROM users WHERE email = :email AND role = :role"),
            {"email": req.email.strip().lower(), "role": req.role}
        ).fetchone()
 
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or role")
 
        user = dict(row._mapping)
 
        if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid password")
 
        token = create_token({
            "user_id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        })
 
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }
    finally:
        db.close()
 
 
# ── PATIENT LOGIN — STEP 1: Send OTP ─────────────────
@router.post("/api/auth/patient/send-otp")
def patient_send_otp(req: PatientOTPRequest):
    db = SessionLocal()
    try:
        # Verify name + patient_id + phone all match
        row = db.execute(text("""
            SELECT * FROM patients
            WHERE LOWER(name) = LOWER(:name)
              AND patient_id = :patient_id
              AND phone = :phone
        """), {
            "name": req.name.strip(),
            "patient_id": req.patient_id.strip(),
            "phone": req.phone.strip()
        }).fetchone()
 
        if not row:
            raise HTTPException(status_code=404, detail="No patient found with these details. Please check your Name, Patient ID, and Phone number.")
 
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        otp_store[req.phone] = {
            "otp": otp,
            "patient_id": req.patient_id,
            "name": req.name,
            "expires": datetime.utcnow() + timedelta(minutes=10)
        }
 
        # In production: send SMS via Twilio
        # For demo: return OTP in response
        return {
            "message": "OTP generated successfully",
            "otp": otp,  # Remove this in production
            "demo_note": "In production, this OTP would be sent via SMS"
        }
    finally:
        db.close()
 
 
# ── PATIENT LOGIN — STEP 2: Verify OTP ───────────────
@router.post("/api/auth/patient/verify-otp")
def patient_verify_otp(req: PatientVerifyOTPRequest):
    stored = otp_store.get(req.phone)
 
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
 
    if datetime.utcnow() > stored["expires"]:
        del otp_store[req.phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
 
    if stored["otp"] != req.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")
 
    # OTP valid — issue token
    del otp_store[req.phone]
 
    token = create_token({
        "patient_id": stored["patient_id"],
        "name": stored["name"],
        "phone": req.phone,
        "role": "patient"
    })
 
    return {
        "token": token,
        "user": {
            "name": stored["name"],
            "patient_id": stored["patient_id"],
            "role": "patient"
        }
    }