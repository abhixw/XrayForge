import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from groq import Groq

from ml_utils import init_model, predict_image
from dotenv import load_dotenv

load_dotenv()

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
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    try:
        contents = await file.read()
        results = predict_image(contents)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExplainRequest(BaseModel):
    probability: float
    diagnosis: str
    
@app.post("/api/explain")
def explain(req: ExplainRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "YOUR_GROQ_API_KEY" or api_key == "YOUR_API_KEY_HERE":
        # Fallback if user hasn't set the key
        return {
            "explanation": f"The ML model predicts {'a fracture' if req.diagnosis == 'Fracture Detected' else 'no fracture'} with a {(req.probability*100):.1f}% confidence. (NOTE: Groq API key not provided, using placeholder explanation. Please add GROQ_API_KEY to backend/.env to use AI explanations)",
            "risk_score": 75 if req.diagnosis == "Fracture Detected" else 10
        }
        
    try:
        client = Groq(api_key=api_key)
        
        prompt = f"""
        You are a radiologist assistant system. 
        A convolutional neural network has analyzed a patient's MSK X-ray and given the following diagnosis: {req.diagnosis}
        The confidence probability of fracture is: {(req.probability*100):.2f}%
        
        Please provide a short, professional clinical explanation of this result for the doctor, identifying potential typical scenarios or next steps. 
        Also, provide a generic numerical "Risk Score" for recovery (0-100, where 100 means high risk/long recovery, and 0 means no risk). 
        Format your response exactly as:
        EXPLANATION: [your text]
        RISK_SCORE: [number]
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
        
        text = chat_completion.choices[0].message.content
        
        exp = text.split("EXPLANATION:")[1].split("RISK_SCORE:")[0].strip() if "EXPLANATION:" in text else text
            
        return {"explanation": exp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
