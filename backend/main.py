# import os
# import uuid
# from datetime import datetime

# from fastapi import FastAPI, UploadFile, File, HTTPException, Form
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import text

# import uvicorn
# from groq import Groq
# from dotenv import load_dotenv

# from ml_utils import init_model, predict_image
# from database import SessionLocal

# load_dotenv()

# MODEL_VERSION = "v2"  # ✅ ADDED

# app = FastAPI(title="CDSS Fracture Detection API")

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Load model
# @app.on_event("startup")
# def startup_event():
#     init_model()


# @app.get("/")
# def read_root():
#     return {"message": "CDSS API Running"}


# @app.get("/api/version")  # ✅ ADDED
# def get_version():
#     return {"model_version": MODEL_VERSION}


# # =========================
# # 🔥 PREDICT (STORE IN DB)
# # =========================
# @app.post("/api/predict")
# async def predict(
#     file: UploadFile = File(...),
#     patient_name: str = Form("Anonymous"),
#     patient_id: str = Form("N/A")
# ):
#     if not file.content_type.startswith("image/"):
#         raise HTTPException(status_code=400, detail="File must be an image.")

#     try:
#         contents = await file.read()
#         results = predict_image(contents)

#         case_id = str(uuid.uuid4())

#         # ✅ SAVE IMAGE TO DISK
#         upload_dir = "uploads"
#         os.makedirs(upload_dir, exist_ok=True)
#         image_filename = f"{case_id}_{file.filename}"
#         image_path = os.path.join(upload_dir, image_filename)
#         with open(image_path, "wb") as f:
#             f.write(contents)

#         db = SessionLocal()

#         db.execute(text("""
#             INSERT INTO cases (
#                 id, image_path, prediction, confidence,
#                 risk_score, risk_level, notes
#             )
#             VALUES (
#                 :id, :image_path, :prediction, :confidence,
#                 :risk_score, :risk_level, :notes
#             )
#         """), {
#             "id": case_id,
#             "image_path": image_path,
#             "prediction": results["diagnosis"],
#             "confidence": results["probability"],
#             "risk_score": int(results["probability"] * 100),
#             "risk_level": results.get("risk_level", "Unknown"),
#             "notes": ""
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
# # 📄 GET ALL CASES
# # =========================
# @app.get("/api/cases")
# def get_all_cases():
#     db = SessionLocal()

#     rows = db.execute(text("""
#         SELECT * FROM cases ORDER BY created_at DESC
#     """)).fetchall()

#     db.close()

#     return [dict(row._mapping) for row in rows]


# # =========================
# # 📄 GET SINGLE CASE
# # =========================
# @app.get("/api/case/{case_id}")
# def get_case(case_id: str):
#     db = SessionLocal()

#     row = db.execute(text("""
#         SELECT * FROM cases WHERE id = :id
#     """), {"id": case_id}).fetchone()

#     db.close()

#     if not row:
#         raise HTTPException(status_code=404, detail="Case not found")

#     return dict(row._mapping)


# # =========================
# # ✖ FEEDBACK SYSTEM
# # =========================
# class FeedbackRequest(BaseModel):
#     case_id: str
#     model_prediction: str
#     correct_label: str
#     confidence: float
#     image_path: str


# @app.post("/api/feedback")
# def save_feedback(req: FeedbackRequest):
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


# # =========================
# # ✔ OVERRIDE (DOCTOR)
# # =========================
# class OverrideRequest(BaseModel):
#     label: str
#     notes: str = ""


# @app.post("/api/override/{case_id}")
# def override(case_id: str, req: OverrideRequest):
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


# # =========================
# # 🤖 LLM EXPLANATION
# # =========================
# class ExplainRequest(BaseModel):
#     probability: float
#     diagnosis: str
#     risk_level: str


# @app.post("/api/explain")
# def explain(req: ExplainRequest):
#     api_key = os.getenv("GROQ_API_KEY")

#     if not api_key:
#         return {
#             "explanation": f"Prediction: {req.diagnosis} with {(req.probability*100):.1f}% confidence."
#         }

#     try:
#         client = Groq(api_key=api_key)

#         prompt = f"""
#         You are a clinical assistant.

#         Prediction: {req.diagnosis}
#         Confidence: {(req.probability*100):.1f}%
#         Risk: {req.risk_level}

#         Explain briefly in bullet points.
#         Do not change values.
#         """

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
 
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
 
import uvicorn
from groq import Groq
from dotenv import load_dotenv
 
from ml_utils import init_model, predict_image
from database import SessionLocal
 
load_dotenv()
 
MODEL_VERSION = "v2"
 
app = FastAPI(title="CDSS Fracture Detection API")
 
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Load model
@app.on_event("startup")
def startup_event():
    init_model()
 
 
@app.get("/")
def read_root():
    return {"message": "CDSS API Running"}
 
 
@app.get("/api/version")
def get_version():
    return {"model_version": MODEL_VERSION}
 
 
# =========================
# 📊 STATS
# =========================
@app.get("/api/stats")
def get_stats():
    db = SessionLocal()
 
    total = db.execute(text("SELECT COUNT(*) FROM cases")).scalar()
    fractures = db.execute(text(
        "SELECT COUNT(*) FROM cases WHERE prediction = 'Fracture Detected'"
    )).scalar()
    approved = db.execute(text(
        "SELECT COUNT(*) FROM cases WHERE approved = TRUE"
    )).scalar()
    overridden = db.execute(text(
        "SELECT COUNT(*) FROM cases WHERE doctor_decision IS NOT NULL AND doctor_decision != prediction"
    )).scalar()
    feedback = db.execute(text("SELECT COUNT(*) FROM feedback")).scalar()
 
    db.close()
 
    if approved and approved > 0:
        correct = approved - (overridden or 0)
        accuracy = round((correct / approved * 100), 1)
    else:
        accuracy = 0.0
 
    return {
        "total_cases": total or 0,
        "fractures_detected": fractures or 0,
        "model_accuracy": accuracy,
        "feedback_records": feedback or 0
    }
 
 
# =========================
# 🔥 PREDICT (STORE IN DB)
# =========================
@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    patient_name: str = Form("Anonymous"),
    patient_id: str = Form("N/A")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
 
    try:
        contents = await file.read()
        results = predict_image(contents)
 
        case_id = str(uuid.uuid4())
 
        # Save image to disk
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        image_filename = f"{case_id}_{file.filename}"
        image_path = os.path.join(upload_dir, image_filename)
        with open(image_path, "wb") as f:
            f.write(contents)
 
        db = SessionLocal()
 
        db.execute(text("""
            INSERT INTO cases (
                id, image_path, prediction, confidence,
                risk_score, risk_level, notes
            )
            VALUES (
                :id, :image_path, :prediction, :confidence,
                :risk_score, :risk_level, :notes
            )
        """), {
            "id": case_id,
            "image_path": image_path,
            "prediction": results["diagnosis"],
            "confidence": results["probability"],
            "risk_score": int(results["probability"] * 100),
            "risk_level": results.get("risk_level", "Unknown"),
            "notes": ""
        })
 
        db.commit()
        db.close()
 
        return {
            "case_id": case_id,
            "image_path": image_path,
            **results
        }
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
# =========================
# 📄 GET ALL CASES
# =========================
@app.get("/api/cases")
def get_all_cases():
    db = SessionLocal()
 
    rows = db.execute(text("""
        SELECT * FROM cases ORDER BY created_at DESC
    """)).fetchall()
 
    db.close()
 
    return [dict(row._mapping) for row in rows]
 
 
# =========================
# 📄 GET SINGLE CASE
# =========================
@app.get("/api/case/{case_id}")
def get_case(case_id: str):
    db = SessionLocal()
 
    row = db.execute(text("""
        SELECT * FROM cases WHERE id = :id
    """), {"id": case_id}).fetchone()
 
    db.close()
 
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
 
    return dict(row._mapping)
 
 
# =========================
# ✖ FEEDBACK SYSTEM
# =========================
class FeedbackRequest(BaseModel):
    case_id: str
    model_prediction: str
    correct_label: str
    confidence: float
    image_path: str
 
 
@app.post("/api/feedback")
def save_feedback(req: FeedbackRequest):
    db = SessionLocal()
 
    db.execute(text("""
        INSERT INTO feedback (
            case_id, model_prediction, correct_label,
            confidence, image_path
        )
        VALUES (
            :case_id, :model_prediction, :correct_label,
            :confidence, :image_path
        )
    """), req.dict())
 
    db.commit()
    db.close()
 
    return {"status": "feedback saved"}
 
 
# =========================
# ✔ OVERRIDE (DOCTOR)
# =========================
class OverrideRequest(BaseModel):
    label: str
    notes: str = ""
 
 
@app.post("/api/override/{case_id}")
def override(case_id: str, req: OverrideRequest):
    db = SessionLocal()
 
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
    db.close()
 
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Case not found")
 
    return {"status": "updated", "case_id": case_id}
 
 
# =========================
# 🤖 LLM EXPLANATION
# =========================
class ExplainRequest(BaseModel):
    probability: float
    diagnosis: str
    risk_level: str
 
 
@app.post("/api/explain")
def explain(req: ExplainRequest):
    api_key = os.getenv("GROQ_API_KEY")
 
    if not api_key:
        return {
            "explanation": f"Prediction: {req.diagnosis} with {(req.probability*100):.1f}% confidence."
        }
 
    try:
        client = Groq(api_key=api_key)
 
        prompt = f"""
        You are a clinical assistant.
 
        Prediction: {req.diagnosis}
        Confidence: {(req.probability*100):.1f}%
        Risk: {req.risk_level}
 
        Explain briefly in bullet points.
        Do not change values.
        """
 
        chat = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant"
        )
 
        return {"explanation": chat.choices[0].message.content.strip()}
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
 