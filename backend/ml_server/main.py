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

MODEL_PATH = os.getenv("MODEL_PATH", "/data/model.pt")
MODEL_URL = os.getenv("MODEL_URL")  # URL we’ll set in Railway for filebrowser
print(f"Loading model from {MODEL_PATH}")

# ── Class names — exact order from your training code ─────────────────────────
CLASS_NAMES = ["acne", "tinea", "lichen", "eczema"]


def ensure_model_file():
    if os.path.exists(MODEL_PATH):
        print("Model file already present, skipping download.")
        return

    if not MODEL_URL:
        raise RuntimeError("MODEL_URL is not set and model file is missing.")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    print(f"Downloading model from {MODEL_URL} to {MODEL_PATH} ...")

    resp = requests.get(MODEL_URL, stream=True, timeout=60)
    resp.raise_for_status()

    with open(MODEL_PATH, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    print("Model download complete.")


# ── Load model at startup ─────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

ensure_model_file()
checkpoint = torch.load(MODEL_PATH, map_location=device)

backbone = checkpoint["backbone"]       # e.g. "efficientnet_b3"
model_name = checkpoint["model_name"]   # e.g. "efficientnet_b3"

model = timm.create_model(backbone, pretrained=False, num_classes=len(CLASS_NAMES))
model.load_state_dict(checkpoint["model_state_dict"])
model.to(device)
model.eval()

# ── Normalization — dataset stats (can override via env) ──────────────────────
MEAN = list(map(float, os.getenv("NORM_MEAN", "0.612,0.487,0.423").split(",")))
STD = list(map(float, os.getenv("NORM_STD", "0.598,0.513,0.431").split(",")))

# ── Transforms — match your validation pipeline ───────────────────────────────
transform = A.Compose(
    [
        A.Resize(height=256, width=256),
        A.CenterCrop(height=224, width=224),
        A.Normalize(mean=MEAN, std=STD),
        ToTensorV2(),
    ]
)

class PredictRequest(BaseModel):
    image_url: str

@app.post("/predict")
async def predict(req: PredictRequest):
    try:
        response = requests.get(req.image_url, timeout=10)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content)).convert("RGB")
        arr = np.array(img)
        aug = transform(image=arr)
        tensor = aug["image"].unsqueeze(0).to(device)

        with torch.no_grad():
            logits = model(tensor)
            logits = logits / TEMPERATURE
            probs = F.softmax(logits, dim=1)[0]

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

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": model_name,
        "backbone": backbone,
        "device": str(device),
        "model_path": MODEL_PATH,
    }
