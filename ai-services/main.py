from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import numpy as np
import cv2

# ✅ THIS LINE IS CRITICAL
app = FastAPI()

# ✅ CORS (important for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "AI Service Running 🚀"}

# ✅ FIX — reject low confidence detections
@app.post("/embed")
async def get_embedding(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        result = DeepFace.represent(
            img,
            model_name="Facenet",
            enforce_detection=True  # ✅ CHANGED: True = reject if no clear face found
        )

        # ✅ NEW: check facial area confidence
        facial_area = result[0].get("face_confidence", 0)
        if facial_area < 0.9:
            return {
                "success": False,
                "error": "Low confidence face detection"
            }

        embedding = result[0]["embedding"]
        return {
            "success": True,
            "embedding": embedding
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }