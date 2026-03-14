# ml_server/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import torch.nn.functional as F
import timm
import albumentations as A
from albumentations.pytorch import ToTensorV2
from PIL import Image
import numpy as np
import requests
from io import BytesIO
import os

app = FastAPI()

# ── Config from env ────────────────────────────────────────────────────────────
TEMPERATURE = float(os.getenv("SOFTMAX_TEMPERATURE", "4.0"))

# Path to the model file; easy to swap by changing env var in Railway
MODEL_PATH = os.getenv("MODEL_PATH", "/data/model.pt")
print(f"Loading model from {MODEL_PATH}")

# ── Class names — exact order from your training code ─────────────────────────
# class_names = ['acne', 'tinea', 'lichen', 'eczema']
CLASS_NAMES = ["acne", "tinea", "lichen", "eczema"]

# ── Load model at startup ─────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

checkpoint = torch.load(MODEL_PATH, map_location=device)

backbone = checkpoint["backbone"]       # e.g. "efficientnet_b3"
model_name = checkpoint["model_name"]   # e.g. "efficientnet_b3"

model = timm.create_model(backbone, pretrained=False, num_classes=len(CLASS_NAMES))
model.load_state_dict(checkpoint["model_state_dict"])
model.to(device)
model.eval()

# ── Normalization — dataset stats (can override via env) ──────────────────────
MEAN = list(
  map(float, os.getenv("NORM_MEAN", "0.612,0.487,0.423").split(","))
)
STD = list(
  map(float, os.getenv("NORM_STD", "0.598,0.513,0.431").split(","))
)

# ── Transforms — match your validation pipeline ───────────────────────────────
transform = A.Compose(
    [
        A.Resize(height=256, width=256),
        A.CenterCrop(height=224, width=224),
        A.Normalize(mean=MEAN, std=STD),
        ToTensorV2(),
    ]
)

# ── Request schema ─────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    image_url: str


# ── POST /predict ──────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict(req: PredictRequest):
    try:
        # Download image from URL (e.g. Cloudinary)
        response = requests.get(req.image_url, timeout=10)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content)).convert("RGB")
        arr = np.array(img)
        aug = transform(image=arr)
        tensor = aug["image"].unsqueeze(0).to(device)  # [1, 3, 224, 224]

        with torch.no_grad():
            logits = model(tensor)             # [1, num_classes]
            logits = logits / TEMPERATURE
            probs = F.softmax(logits, dim=1)[0]  # [num_classes]

        confidence, pred_idx = torch.max(probs, dim=0)

        return {
            "predicted_label": CLASS_NAMES[pred_idx.item()],
            "confidence_score": round(confidence.item() * 100, 2),
            "all_scores": {
                CLASS_NAMES[i]: round(probs[i].item() * 100, 2)
                for i in range(len(CLASS_NAMES))
            },
            "model_name": model_name,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /health ────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": model_name,
        "backbone": backbone,
        "device": str(device),
        "model_path": MODEL_PATH,
    }
