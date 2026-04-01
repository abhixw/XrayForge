import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from groq import Groq

from datetime import datetime
from ml_utils import init_model, predict_image
from dotenv import load_dotenv

load_dotenv()

# In-memory database for demo purposes
results_db = {}

app = FastAPI(title="CDSS Fracture Detection API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: Load ML objects
@app.on_event("startup")
def startup_event():
    init_model()
    
@app.get("/")
def read_root():
    return {"message": "Welcome to the CDSS API"}

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
        
        # Store in "database"
        case_id = str(uuid.uuid4())
        results_db[case_id] = {
            **results,
            "case_id": case_id,
            "patient_name": patient_name,
            "patient_id": patient_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "initial_prediction": results["diagnosis"],
            "initial_probability": results["probability"],
            "approved": False,
            "doctor_decision": None,
            "doctor_notes": ""
        }
        
        return results_db[case_id]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExplainRequest(BaseModel):
    probability: float
    diagnosis: str
    risk_level: str
    
@app.post("/api/explain")
def explain(req: ExplainRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "YOUR_GROQ_API_KEY" or api_key == "YOUR_API_KEY_HERE":
        # Fallback if user hasn't set the key
        return {
            "explanation": f"The ML model predicts {'a fracture' if req.diagnosis == 'Fracture Detected' else 'no fracture'} with a {(req.probability*100):.1f}% confidence. (NOTE: Groq API key not provided, using placeholder explanation. Please add GROQ_API_KEY to backend/.env to use AI explanations)"
        }
        
    try:
        client = Groq(api_key=api_key)
        
        prompt = f"""
        You are a clinical radiologist assistant. 
        Analyze the following AI results and provide CONCISE, professional CLINICAL INSIGHTS:
        - AI Prediction: {req.diagnosis}
        - Confidence Level: {(req.probability*100):.2f}%
        - Risk Classification: {req.risk_level}
        
        Focus only on:
        1. Professional interpretation of the confidence level.
        2. Expected next steps or differential considerations.
        
        FORMATTING RULES:
        - Use bullet points (•).
        - Put EXACTLY one empty line between each bullet point for readability.
        - Keep the response extremely brief.
        - NO fluff or introductory sentences.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        )
        
        text = chat_completion.choices[0].message.content.strip()
        return {"explanation": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

@app.get("/api/cases")
def get_all_cases():
    # Return all cases sorted by timestamp (newest first)
    sorted_cases = sorted(results_db.values(), key=lambda x: x['timestamp'], reverse=True)
    return sorted_cases

@app.get("/api/case/{case_id}")
def get_case(case_id: str):
    if case_id not in results_db:
        raise HTTPException(status_code=404, detail="Case not found.")
    return results_db[case_id]

class OverrideRequest(BaseModel):
    label: str
    notes: str = ""

@app.post("/api/override/{case_id}")
def override(case_id: str, req: OverrideRequest):
    if case_id not in results_db:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    results_db[case_id]["diagnosis"] = req.label
    results_db[case_id]["approved"] = True
    results_db[case_id]["doctor_decision"] = req.label
    results_db[case_id]["doctor_notes"] = req.notes
    return {"status": "success", "case_id": case_id}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
