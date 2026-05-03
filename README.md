# AkomaDerma 🩺

> AI-Supported Teledermatology Platform for accessible dermatology care in Ghana.

AkomaDerma is a Ghana-focused, AI-supported teledermatology web application designed to support asynchronous specialist review of skin conditions in rural and peripheral clinical settings. The platform connects frontline clinicians with remote dermatologists, integrating an AI-assisted lesion classification model trained on dermatological conditions common in Ghana (eczema, acne, tinea, and lichen planus), with particular attention to melanin-rich skin tones.

**Live demo:** https://akomadermagh.up.railway.app

---

## Core Workflow

1. **Clinician** creates a patient record, submits a case with lesion images and clinical history.
2. **Dermatologist** reviews the submitted case asynchronously, optionally uses AI-generated classification support, and records a diagnosis and treatment plan.
3. **Clinician** receives structured feedback and closes the case.

---

## Project Structure

```
akomaderma/
├── frontend/       # React + Vite (TypeScript) web application
├── backend/        # Node.js + Express REST API with Socket.IO
├── ai_model/       # Python FastAPI AI service – EfficientNet-B3 classifier
└── database/       # MySQL schema and seed scripts
```

---

## ⚙️ Prerequisites

- [Node.js v18+](https://nodejs.org/)
- [Python 3.9+](https://www.python.org/)
- [MySQL 8.0+](https://www.mysql.com/)
- npm or yarn
- pip
- [Git](https://git-scm.com/)

---

## Local Setup and Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/nonzuzo/AkomaDerma.git
cd akomaderma
```

### Step 2 — Set up environment variables

**Backend:**

```bash
cd backend
cp .env.example .env
```

Fill in `backend/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=akomaderma
JWT_SECRET=your_jwt_secret
PORT=5001
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
```

Fill in `frontend/.env`:

```
VITE_API_URL=http://localhost:5001
VITE_AI_SERVICE_URL=http://localhost:8000
```

**AI Model:**

```bash
cd ai_model
cp .env.example .env
```

Fill in `ai_model/.env`:

```
MODEL_PATH=./weights/efficientnet_b3_best.pth
PORT=8000
```

### Step 3 — Set up the database

```bash
mysql -u root -p
CREATE DATABASE akomaderma;
exit
mysql -u root -p akomaderma < database/schema.sql
```

### Step 4 — Run the backend

```bash
cd backend
npm install
npm run dev
```

API runs at: `http://localhost:5001`

### Step 5 — Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Web app runs at: `http://localhost:5173`

### Step 6 — Run the AI model service

```bash
cd ai_model
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

AI service runs at: `http://localhost:8000`

>  Place the model weights file `efficientnet_b3_best.pth` in the `/ai_model/weights/` directory before starting the AI service.

---

## Main User Roles

### Clinician

- Register and manage patient records
- Create and submit consultation cases with lesion images
- View dermatologist responses and treatment plans
- Close resolved cases

### Dermatologist

- Review submitted cases asynchronously
- View AI-generated lesion classification suggestions
- Record diagnoses and structured treatment plans
- Respond to clinician queries

### Test Credentials (seed data must be loaded)

| Role          | Email                    | Password     |
| ------------- | ------------------------ | ------------ |
| Clinician     | clinician@akomaderma.com | password     |
| Dermatologist | derma@akomaderma.com     | 1234Password |

---

## Tech Stack

| Layer      | Technology                                                            |
| ---------- | --------------------------------------------------------------------- |
| Frontend   | React 18, Vite, TypeScript, Bootstrap, Socket.IO client               |
| Backend    | Node.js, Express 5, MySQL2, Socket.IO, JWT, Multer, Cloudinary        |
| AI Model   | Python 3.9+, FastAPI, PyTorch, EfficientNet-B3 (timm), Albumentations |
| Auth       | JWT (jsonwebtoken + bcrypt)                                           |
| Email      | Nodemailer, Resend                                                    |
| Deployment | Railway                                                               |

---

##  AI Model

### Architecture Comparison

Three convolutional neural network architectures were trained and evaluated on the same curated dataset:

| Model               | Result                            |
| ------------------- | --------------------------------- |
| ResNet-50           | Baseline                          |
| ConvNeXt-Tiny       | Improved                          |
| **EfficientNet-B3** | ✅ Best – selected for production |

EfficientNet-B3 achieved the best trade-off between accuracy and calibration on the validation set and was selected as the final deployed model.

### Model Details

| Property        | Detail                                                            |
| --------------- | ----------------------------------------------------------------- |
| Architecture    | EfficientNet-B3                                                   |
| Framework       | PyTorch                                                           |
| Task            | Multi-class skin lesion classification                            |
| Classes         | Eczema, Acne, Tinea, Lichen Planus                                |
| Input           | RGB lesion image (resized to 300×300)                             |
| Output          | Predicted class + confidence score                                |
| Skin tone focus | Validated across Fitzpatrick types I–VI (emphasis on Types IV–VI) |

### Datasets Used

| Dataset             | Description                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| **DDI (Stanford)**  | Histopathology-confirmed clinical images curated across diverse Fitzpatrick skin types |
| **SD-198**          | 6,584 clinical images across 198 skin disease categories                               |
| **DermNet-derived** | Web-sourced images grouped into acne, eczema, tinea and lichen planus classes          |
| **Fitzpatrick17k**  | 16,577 images with 114 diagnoses and Fitzpatrick I–VI labels                           |

> Full evaluation results (accuracy, Cohen's kappa) are reported in **Chapter 5** of the project report.

> ⚠️ The AI classifier is a decision-support tool only and does not replace clinical judgement.

---

## 🔌 API Routes

| Method   | Endpoint                  | Description                      |
| -------- | ------------------------- | -------------------------------- |
| POST     | `/api/auth/...`           | Authentication (login, register) |
| GET/POST | `/api/cases/...`          | Case management                  |
| GET/POST | `/api/patients/...`       | Patient records                  |
| GET/POST | `/api/clinicians/...`     | Clinician actions & appointments |
| GET/POST | `/api/dermatologists/...` | Dermatologist actions            |
| POST     | `/api/ai/...`             | AI classification requests       |

---

## Testing

```bash
# Backend/API tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test

# AI model evaluation
cd ai_model && python evaluate.py
```

---

##  Live Deployment (Railway)

| Service     | URL                                                        |
| ----------- | ---------------------------------------------------------- |
| Frontend    | https://akomadermagh.up.railway.app                        |
| Backend API | https://backend-production-2aeb.up.railway.app             |
| AI Service  | https://model-production-dc38.up.railway.app               |
| Database    | MySQL instance hosted on Railway (not publicly accessible) |

All three services are connected to this GitHub repository via Railway's GitHub integration, with automatic deployments on push to the `main` branch.

To redeploy:

1. Push changes to the `main` branch on GitHub.
2. Railway automatically detects the push and redeploys.
3. Monitor deployment logs via the Railway dashboard.

>  These URLs were active at the time of submission but may be disabled after the project is examined, as hosting was provided via a paid Railway Hobby plan.

---

##  Known Limitations

- The AI model was trained on publicly available datasets; performance may vary on clinical images taken with low-resolution devices.
- Real-time notifications use Socket.IO; earlier versions used polling.
- No current integration with LHIMS (Ghana Health Information System) — identified as future work in Chapter 6.
- The system was evaluated with de-identified cases; full clinical validation with a larger cohort is recommended before production deployment.

---

## External Services

- **Railway** — hosting for frontend, backend, AI service and MySQL database.
- **Cloudinary** — image upload and storage for lesion photographs.
- **OpenAI API** — used for non-diagnostic text features (medication plan drafting, patient summary). The original key will be revoked after assessment; configure your own key to re-enable these features.

---

## Author

**Nonzuzo Sikhosana**  
BSc Computer Science – Ashesi University, Ghana  
nonzuzo.sikhosana@ashesi.edu.gh  
Supervisor: Prof. Justice Appati  
Academic Year: 2025/2026

---

## 📄 License

Developed as a final year capstone project at Ashesi University.  
All rights reserved © 2026 Nonzuzo Sikhosana.
