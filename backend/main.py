# import os
# import uuid
# from datetime import datetime

# from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from pydantic import BaseModel
# from sqlalchemy import text
# import jwt

# import uvicorn
# from groq import Groq
# from dotenv import load_dotenv

# from ml_utils import init_model, predict_image
# from database import SessionLocal
# from auth import router as auth_router, get_current_user

# load_dotenv()

# MODEL_VERSION = "v2"

# app = FastAPI(title="CDSS Fracture Detection API")

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"]
# )

# # Security
# security = HTTPBearer()

# # Include auth routes
# app.include_router(auth_router)

# # Load model
# @app.on_event("startup")
# def startup_event():
#     init_model()


# @app.get("/")
# def read_root():
#     return {"message": "CDSS API Running"}


# @app.get("/api/version")
# def get_version():
#     return {"model_version": MODEL_VERSION}


# # =========================
# # HOSPITAL ADMIN - PATIENT MANAGEMENT
# # =========================

# # Get all registered patients — accessible by both admin and doctor
# @app.get("/api/admin/patients")
# def get_patients(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     if user.get("role") not in ("admin", "doctor"):  # ✅ FIXED — doctors can read patient list
#         raise HTTPException(status_code=403, detail="Access denied")

#     db = SessionLocal()
#     try:
#         result = db.execute(text("SELECT id, name, patient_id, created_at FROM patients ORDER BY created_at DESC"))
#         patients = [dict(row) for row in result.mappings()]
#         return patients
#     finally:
#         db.close()


# # Register new patient (Auto-generates PT-001, PT-002...) — admin only
# @app.post("/api/admin/register-patient")
# def register_patient(req: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     if user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Admin access only")

#     name = req.get("name")
#     if not name or not name.strip():
#         raise HTTPException(status_code=400, detail="Patient name is required")

#     db = SessionLocal()
#     try:
#         last = db.execute(text("SELECT patient_id FROM patients ORDER BY id DESC LIMIT 1")).fetchone()
#         if last and last.patient_id:
#             num = int(last.patient_id.replace("PT-", "")) + 1
#         else:
#             num = 1

#         patient_id = f"PT-{num:03d}"

#         db.execute(text("""
#             INSERT INTO patients (name, patient_id, created_at)
#             VALUES (:name, :patient_id, :created_at)
#         """), {
#             "name": name.strip(),
#             "patient_id": patient_id,
#             "created_at": datetime.utcnow()
#         })
#         db.commit()

#         return {"message": "Patient registered successfully", "patient_id": patient_id}
#     finally:
#         db.close()


# # Get all doctors — admin only
# @app.get("/api/admin/doctors")
# def get_doctors(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     if user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Admin access only")

#     db = SessionLocal()
#     try:
#         result = db.execute(text(
#             "SELECT id, username, email, created_at FROM users WHERE role = 'doctor' ORDER BY created_at DESC"
#         ))
#         doctors = [dict(row) for row in result.mappings()]
#         return doctors
#     finally:
#         db.close()


# # =========================
# # 📊 GENERAL STATS (for Doctor Dashboard)
# # =========================
# @app.get("/api/stats")
# def get_stats():
#     db = SessionLocal()
#     total = db.execute(text("SELECT COUNT(*) FROM cases")).scalar() or 0
#     fractures = db.execute(text("SELECT COUNT(*) FROM cases WHERE prediction = 'Fracture Detected'")).scalar() or 0
#     approved = db.execute(text("SELECT COUNT(*) FROM cases WHERE approved = TRUE")).scalar() or 0
#     feedback = db.execute(text("SELECT COUNT(*) FROM feedback")).scalar() or 0

#     accuracy = round((approved / total * 100), 1) if total > 0 else 0.0

#     db.close()

#     return {
#         "total_cases": total,
#         "fractures_detected": fractures,
#         "model_accuracy": accuracy,
#         "feedback_records": feedback
#     }


# # =========================
# # 🔥 PREDICT (Doctor only)
# # =========================
# @app.post("/api/predict")
# async def predict(
#     file: UploadFile = File(...),
#     patient_name: str = Form("Anonymous"),
#     patient_id: str = Form(...),
#     credentials: HTTPAuthorizationCredentials = Depends(security)
# ):
#     if not file.content_type.startswith("image/"):
#         raise HTTPException(status_code=400, detail="File must be an image.")

#     user = get_current_user(credentials)
#     if user.get("role") != "doctor":
#         raise HTTPException(status_code=403, detail="Only doctors can upload X-rays")

#     try:
#         contents = await file.read()
#         results = predict_image(contents)

#         case_id = str(uuid.uuid4())

#         upload_dir = "uploads"
#         os.makedirs(upload_dir, exist_ok=True)
#         image_filename = f"{case_id}_{file.filename}"
#         image_path = os.path.join(upload_dir, image_filename)
#         with open(image_path, "wb") as f:
#             f.write(contents)

#         db = SessionLocal()

#         db.execute(text("""
#             INSERT INTO cases (
#                 id, image_path, prediction, confidence, risk_score, risk_level,
#                 patient_name, patient_id, doctor_id, notes, approved
#             )
#             VALUES (
#                 :id, :image_path, :prediction, :confidence, :risk_score, :risk_level,
#                 :patient_name, :patient_id, :doctor_id, '', false
#             )
#         """), {
#             "id": case_id,
#             "image_path": image_path,
#             "prediction": results["diagnosis"],
#             "confidence": results["probability"],
#             "risk_score": int(results["probability"] * 100),
#             "risk_level": results.get("risk_level", "Low"),
#             "patient_name": patient_name,
#             "patient_id": patient_id,
#             "doctor_id": user["user_id"]
#         })

#         db.commit()
#         db.close()

#         return {
#             "case_id": case_id,
#             "image_path": image_path,
#             **results
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # =========================
# # 📊 ADMIN STATS
# # =========================
# @app.get("/api/admin/stats")
# def get_admin_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     if user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Admin access only")

#     db = SessionLocal()
#     total = db.execute(text("SELECT COUNT(*) FROM cases")).scalar() or 0
#     fractures = db.execute(text("SELECT COUNT(*) FROM cases WHERE prediction = 'Fracture Detected'")).scalar() or 0
#     approved = db.execute(text("SELECT COUNT(*) FROM cases WHERE approved = TRUE")).scalar() or 0
#     overrides = db.execute(text("SELECT COUNT(*) FROM cases WHERE doctor_decision IS NOT NULL")).scalar() or 0
#     feedback_count = db.execute(text("SELECT COUNT(*) FROM feedback")).scalar() or 0

#     accuracy = round((approved / total * 100), 1) if total > 0 else 0.0

#     db.close()

#     return {
#         "total_cases": total,
#         "fractures_detected": fractures,
#         "approved_cases": approved,
#         "overrides": overrides,
#         "feedback_records": feedback_count,
#         "model_accuracy": accuracy
#     }


# # =========================
# # 📄 ADMIN - ALL CASES
# # =========================
# @app.get("/api/admin/cases")
# def get_all_cases_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     if user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Admin access only")

#     db = SessionLocal()
#     result = db.execute(text("SELECT * FROM cases ORDER BY created_at DESC"))
#     cases = [dict(row) for row in result.mappings()]
#     db.close()
#     return cases


# # =========================
# # 📄 GET ALL CASES (Role-based)
# # =========================
# @app.get("/api/cases")
# def get_all_cases(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     db = SessionLocal()

#     if user.get("role") == "admin":
#         result = db.execute(text("SELECT * FROM cases ORDER BY created_at DESC"))
#     elif user.get("role") == "doctor":
#         result = db.execute(
#             text("SELECT * FROM cases WHERE doctor_id = :doctor_id ORDER BY created_at DESC"),
#             {"doctor_id": user["user_id"]}
#         )
#     else:
#         db.close()
#         raise HTTPException(status_code=403, detail="Access denied")

#     cases = [dict(row) for row in result.mappings()]
#     db.close()
#     return cases


# # =========================
# # 📄 GET SINGLE CASE
# # =========================
# @app.get("/api/case/{case_id}")
# def get_case(case_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     db = SessionLocal()

#     result = db.execute(text("SELECT * FROM cases WHERE id = :id"), {"id": case_id})
#     row = result.mappings().fetchone()

#     db.close()
#     if not row:
#         raise HTTPException(status_code=404, detail="Case not found")

#     return dict(row)


# # =========================
# # FEEDBACK, OVERRIDE, EXPLAIN
# # =========================
# class FeedbackRequest(BaseModel):
#     case_id: str
#     model_prediction: str
#     correct_label: str
#     confidence: float
#     image_path: str

# @app.post("/api/feedback")
# def save_feedback(req: FeedbackRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
#     db = SessionLocal()
#     db.execute(text("""
#         INSERT INTO feedback (
#             case_id, model_prediction, correct_label,
#             confidence, image_path
#         )
#         VALUES (
#             :case_id, :model_prediction, :correct_label,
#             :confidence, :image_path
#         )
#     """), req.dict())
#     db.commit()
#     db.close()
#     return {"status": "feedback saved"}


# class OverrideRequest(BaseModel):
#     label: str
#     notes: str = ""

# @app.post("/api/override/{case_id}")
# def override(case_id: str, req: OverrideRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
#     user = get_current_user(credentials)
#     if user.get("role") != "doctor":
#         raise HTTPException(status_code=403, detail="Only doctors can override")

#     db = SessionLocal()
#     result = db.execute(text("""
#         UPDATE cases
#         SET doctor_decision = :decision,
#             approved = TRUE,
#             notes = :notes
#         WHERE id = :id
#     """), {
#         "decision": req.label,
#         "notes": req.notes,
#         "id": case_id
#     })
#     db.commit()
#     db.close()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Case not found")
#     return {"status": "updated", "case_id": case_id}


# class ExplainRequest(BaseModel):
#     probability: float
#     diagnosis: str
#     risk_level: str

# @app.post("/api/explain")
# def explain(req: ExplainRequest):
#     api_key = os.getenv("GROQ_API_KEY")
#     if not api_key:
#         return {"explanation": f"Prediction: {req.diagnosis} with {(req.probability*100):.1f}% confidence."}

#     try:
#         client = Groq(api_key=api_key)
#         prompt = f"""
# You are a clinical assistant.

# Prediction: {req.diagnosis}
# Confidence: {(req.probability*100):.1f}%
# Risk: {req.risk_level}

# Explain briefly in 3-4 short sentences. Provide space between sentences.
# Do NOT use bullet points, asterisks, markdown, or any special characters.
# Write in plain text only.
# """
#         chat = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.1-8b-instant"
#         )
#         return {"explanation": chat.choices[0].message.content.strip()}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # =========================
# # RUN SERVER
# # =========================
# if __name__ == "__main__":
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


import os
import uuid
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import text

import uvicorn
from dotenv import load_dotenv

from ml_utils import init_model, predict_image
from database import SessionLocal
from auth import router as auth_router, get_current_user

load_dotenv()

app = FastAPI(title="CDSS Fracture Detection API")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

security = HTTPBearer()
app.include_router(auth_router)

# =========================
# STARTUP
# =========================
@app.on_event("startup")
def startup_event():
    init_model()


@app.get("/")
def root():
    return {"message": "API running"}


# =========================
# PATIENT MANAGEMENT
# =========================

@app.get("/api/admin/patients")
def get_patients(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)
    if user.get("role") not in ("admin", "doctor"):
        raise HTTPException(403, "Access denied")

    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT id, name, patient_id, phone, age, gender, address
            FROM patients ORDER BY created_at DESC
        """))
        return [dict(row) for row in result.mappings()]
    finally:
        db.close()


@app.post("/api/admin/register-patient")
def register_patient(req: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    name = req.get("name")
    phone = req.get("phone")

    if not name or not phone:
        raise HTTPException(400, "Name and phone required")

    db = SessionLocal()
    try:
        last = db.execute(text("SELECT patient_id FROM patients ORDER BY id DESC LIMIT 1")).fetchone()
        num = int(last.patient_id.replace("PT-", "")) + 1 if last else 1
        patient_id = f"PT-{num:03d}"

        db.execute(text("""
            INSERT INTO patients (name, patient_id, phone, age, gender, address, created_at)
            VALUES (:name, :patient_id, :phone, :age, :gender, :address, :created_at)
        """), {
            "name": name,
            "patient_id": patient_id,
            "phone": phone,
            "age": req.get("age"),
            "gender": req.get("gender"),
            "address": req.get("address"),
            "created_at": datetime.utcnow()
        })

        db.commit()
        return {"patient_id": patient_id}

    finally:
        db.close()


# =========================
# PREDICT (CORE FIXED)
# =========================

@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Upload image only")

    user = get_current_user(credentials)
    if user.get("role") != "doctor":
        raise HTTPException(403, "Doctor only")

    db = SessionLocal()

    try:
        # Validate patient
        patient = db.execute(
            text("SELECT * FROM patients WHERE patient_id = :pid"),
            {"pid": patient_id}
        ).fetchone()

        if not patient:
            raise HTTPException(400, "Invalid patient_id")

        contents = await file.read()
        results = predict_image(contents)

        # 🔥 SAFE HANDLING (CRITICAL FIX)
        diagnosis = results.get("diagnosis", "Unknown")

        prob = results.get("probability")
        try:
            probability = float(prob)
        except:
            probability = 0.0

        risk_level = results.get("risk_level", "Low")

        case_id = str(uuid.uuid4())

        os.makedirs("uploads", exist_ok=True)
        image_path = f"uploads/{case_id}_{file.filename}"

        with open(image_path, "wb") as f:
            f.write(contents)

        db.execute(text("""
            INSERT INTO cases (
                id,
                image_path,
                patient_id,
                doctor_id,
                prediction,
                confidence,
                risk_score,
                risk_level,
                approved,
                doctor_decision,
                notes,
                created_at
            )
            VALUES (
                :id,
                :image_path,
                :patient_id,
                :doctor_id,
                :prediction,
                :confidence,
                :risk_score,
                :risk_level,
                false,
                NULL,
                '',
                NOW()
            )
        """), {
            "id": case_id,
            "image_path": image_path,
            "patient_id": patient_id,
            "doctor_id": user["user_id"],
            "prediction": diagnosis,
            "confidence": probability,
            "risk_score": int(probability * 100),
            "risk_level": risk_level
        })

        db.commit()

        return {
            "case_id": case_id,
            "image_path": image_path,
            "diagnosis": diagnosis,
            "probability": probability,   # 🔥 FIXED KEY
            "risk_level": risk_level
        }

    finally:
        db.close()

# =========================
# GET ALL CASES (DOCTOR + ADMIN)
# =========================

@app.get("/api/cases")
def get_cases(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)

    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT 
                c.id,
                c.patient_id,
                p.name AS patient_name,
                c.prediction,
                c.confidence,
                c.risk_level,
                c.approved,
                c.created_at
            FROM cases c
            JOIN patients p ON c.patient_id = p.patient_id
            ORDER BY c.created_at DESC
        """))

        return [dict(row) for row in result.mappings()]

    finally:
        db.close()

@app.get("/api/patient/cases")
def get_patient_cases(
    patient_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = get_current_user(credentials)

    # Optional: ensure role is patient
    if user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Unauthorized")

    db = SessionLocal()
    try:
        cases = db.execute(text("""
            SELECT * FROM cases
            WHERE patient_id = :patient_id
            ORDER BY created_at DESC
        """ ), {"patient_id": patient_id})

        return [dict(row) for row in cases.mappings()]

    finally:
        db.close()


# =========================
# GET STATS (FINAL FIX)
# =========================
@app.get("/api/stats")
def get_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)

    db = SessionLocal()
    try:
        total_cases = db.execute(
            text("SELECT COUNT(*) FROM cases")
        ).scalar()

        fractures = db.execute(text("""
            SELECT COUNT(*) FROM cases
            WHERE prediction = 'Fracture Detected'
        """)).scalar()

        feedback = db.execute(
            text("SELECT COUNT(*) FROM feedback")
        ).scalar()

        accuracy = db.execute(text("""
    SELECT 
        COALESCE(
            SUM(
                CASE 
                    WHEN doctor_decision IS NULL 
                         AND prediction IS NOT NULL THEN 1
                    WHEN doctor_decision = prediction THEN 1
                    ELSE 0
                END
            ) * 100.0 / NULLIF(COUNT(*), 0),
        0)
    FROM cases
    WHERE approved = TRUE;
""")).scalar()

        return {
            "total_cases": int(total_cases or 0),
            "fractures_detected": int(fractures or 0),
            "feedback_records": int(feedback or 0),
            "model_accuracy": float(round(accuracy or 0, 2))
        }

    finally:
        db.close()







# =========================
# APPROVE
# =========================

@app.post("/api/approve/{case_id}")
def approve(case_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)
    if user.get("role") != "doctor":
        raise HTTPException(403, "Doctor only")

    db = SessionLocal()
    try:
        result = db.execute(
            text("UPDATE cases SET approved = TRUE WHERE id = :id"),
            {"id": case_id}
        )
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(404, "Case not found")

        return {"status": "approved"}

    finally:
        db.close()


# =========================
# OVERRIDE
# =========================

class OverrideRequest(BaseModel):
    label: str
    notes: str = ""


@app.post("/api/override/{case_id}")
def override(case_id: str, req: OverrideRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)
    if user.get("role") != "doctor":
        raise HTTPException(403, "Doctor only")

    db = SessionLocal()
    try:
        result = db.execute(text("""
            UPDATE cases
            SET doctor_decision = :decision,
                approved = TRUE,
                notes = :notes
            WHERE id = :id
        """), {
            "decision": req.label,
            "notes": req.notes,
            "id": case_id
        })

        db.commit()

        if result.rowcount == 0:
            raise HTTPException(404, "Case not found")

        return {"status": "updated"}

    finally:
        db.close()


# =========================
# FEEDBACK
# =========================

class FeedbackRequest(BaseModel):
    case_id: str
    model_prediction: str
    correct_label: str
    confidence: float
    image_path: str


@app.post("/api/feedback")
def feedback(req: FeedbackRequest):
    db = SessionLocal()
    try:
        db.execute(text("""
            INSERT INTO feedback (
                case_id,
                model_prediction,
                correct_label,
                confidence,
                image_path
            )
            VALUES (
                :case_id,
                :model_prediction,
                :correct_label,
                :confidence,
                :image_path
            )
        """), req.dict())

        db.commit()
        return {"status": "saved"}

    finally:
        db.close()


# =========================
# RUN
# =========================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

