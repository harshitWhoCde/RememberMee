# RememberMee 🧠

**RememberMee** is an AI-powered memory companion designed to support individuals with dementia and memory loss. Using real-time face recognition, live speech transcription, and AI-generated memory summaries, it helps users recognize visitors, recall past interactions, and maintain meaningful social connections — all running **entirely on local hardware**.

---

## 🚀 Overview

The system acts as a "digital companion" in the living room. When a visitor enters:

1. **Detects** a face in the live webcam feed using `face-api.js` (client-side).
2. **Identifies** the person by sending a captured frame to the Python AI service, which generates an ArcFace embedding (InsightFace `buffalo_l`).
3. **Matches** the embedding against stored visitors in MongoDB via cosine similarity (threshold `0.45`).
4. **Retrieves** the last recorded memory/context for the recognized visitor.
5. **Transcribes** the live conversation in real-time via a WebSocket connection to the Faster-Whisper STT service.
6. **Summarizes** the conversation using a local Ollama `phi3` LLM on session end.
7. **Archives** the AI-generated memory snippet to MongoDB for future visits.

---

## 🏗️ Architecture

The project is a **four-service system** — all services run locally:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / BROWSER                              │
│               React + Vite Frontend  (port 5173)                    │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  face-api.js │  │  WebSocket   │  │   REST API   │              │
│  │  (in-browser │  │  /ws/stt     │  │  calls       │              │
│  │  detection)  │  │              │  │              │              │
└──┼──────────────┼──┼──────────────┼──┼──────────────┼──────────────┘
   │ JPEG frame   │  │ PCM audio    │  │ HTTP         │
   ▼              │  ▼              │  ▼              │
┌──────────────────────────────────┐  ┌──────────────────────────────┐
│  Python AI Service  (port 8000)  │  │  Node.js Backend (port 5000) │
│  FastAPI + Uvicorn               │  │  Express 5                   │
│                                  │  │                              │
│  POST /embed                     │  │  POST /recognize             │
│   └─ InsightFace buffalo_l       │  │  POST /api/match-face        │
│      ArcFace 512-dim embedding   │  │  POST /api/memory            │
│      SCRFD face detection        │  │  GET  /api/memories          │
│                                  │  │  POST /api/update-context    │
│  WS   /ws/stt                    │  │   └─ calls Ollama phi3 LLM   │
│   └─ Faster-Whisper medium.en    │  │  GET  /api/memory/:name      │
│      int8 quantized, CPU         │  │  POST /api/auth/*            │
└──────────────────────────────────┘  └──────────────┬───────────────┘
                                                      │
                                          ┌───────────▼──────────────┐
                                          │  MongoDB  (port 27017)   │
                                          │  DB: face                │
                                          │  Collections:            │
                                          │   • users                │
                                          │   • memories             │
                                          └──────────────────────────┘
                                                      ▲
                                          ┌───────────┴──────────────┐
                                          │  Ollama  (port 11434)    │
                                          │  Model: phi3             │
                                          │  (conversation summary)  │
                                          └──────────────────────────┘
```

---

## 🗂️ File Structure

```
RememberMee/
├── README.md
│
├── ai-services/                        # Python FastAPI AI microservice
│   ├── main.py                         # FastAPI app — /embed & /ws/stt endpoints
│   ├── requirements.txt                # Python dependencies
│   └── venv/                           # Python virtual environment
│
├── backend/                            # Node.js / Express REST API
│   ├── index.js                        # Server entry — routes, /recognize, /api/match-face
│   ├── package.json
│   ├── controllers/
│   │   └── memoryController.js         # addMemory, getMemories, updateConversationContext
│   ├── models/
│   │   ├── Memory.js                   # Mongoose schema — memories collection
│   │   └── User.js                     # Mongoose schema — users collection
│   ├── routes/
│   │   ├── auth.js                     # /api/auth/login, /api/auth/register
│   │   └── memoryRoutes.js             # /api/memory, /api/memories, /api/update-context
│   └── middleware/
│
└── frontend/                           # React + Vite SPA
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── main.jsx                    # App entry — BrowserRouter
        ├── App.jsx                     # Route definitions
        ├── index.css
        ├── App.css
        ├── components/
        │   ├── Layout.jsx              # Dashboard shell (sidebar + outlet)
        │   ├── Sidebar.jsx             # Navigation sidebar
        │   ├── TopAppBar.jsx           # Top navigation bar
        │   ├── Footer.jsx              # Footer component
        │   └── Webcam.jsx              # Reusable webcam component
        └── pages/
            ├── LivingRoom.jsx          # 🏠 Main page — face detection, STT, recognition
            ├── VisitorArchive.jsx      # 📋 View all saved visitor memories
            ├── VoiceAsk.jsx            # 🎤 Voice Q&A interface
            ├── Profile.jsx             # 👤 Logged-in user profile
            ├── Login.jsx               # 🔐 Authentication — login
            └── Register.jsx            # 📝 Authentication — registration
```

---

## 🤖 AI Models Used

| Model | Purpose | Library / Provider | Dimension |
|---|---|---|---|
| **InsightFace `buffalo_l` (ArcFace)** | Face embedding generation | `insightface` (ONNX/CPU) | 512-dim |
| **SCRFD** (bundled in `buffalo_l`) | Face detection in images | `insightface` | — |
| **face-api.js** (`@vladmandic/face-api`) | In-browser real-time face detection | TensorFlow.js | — |
| **Faster-Whisper `medium.en`** | Real-time speech-to-text (STT) | `faster-whisper` (CTranslate2, int8) | — |
| **Ollama `phi3`** | Conversation summarization (local LLM) | Ollama REST API | — |

### Recognition Details
- **Cosine Similarity Threshold**: `0.45` (tuned for ArcFace angular margin geometry)
- **Multi-embedding matching**: Each user can have multiple stored embeddings for robustness
- **Confidence filter**: Frames with SCRFD detection confidence `< 0.6` are rejected
- **STT config**: `medium.en` with int8 quantization, VAD filter enabled, 3-second inference windows, 300ms overlap

---

## 📦 Packages & Dependencies

### 🐍 AI Services — Python (`ai-services/requirements.txt`)

| Package | Version | Role |
|---|---|---|
| `fastapi` | 0.111.0 | Web framework |
| `uvicorn[standard]` | 0.29.0 | ASGI server |
| `python-multipart` | 0.0.9 | File upload parsing |
| `websockets` | 12.0 | WebSocket support |
| `insightface` | 0.7.3 | ArcFace face recognition |
| `onnxruntime` | 1.17.3 | CPU ONNX inference for InsightFace |
| `faster-whisper` | 1.0.1 | Whisper STT via CTranslate2 |
| `opencv-python-headless` | 4.9.0.80 | Image decoding |
| `numpy` | 1.26.4 | Numerical ops |
| `Pillow` | 10.3.0 | Image processing |
| `anyio` | 4.3.0 | Async utilities |
| `httpx` | 0.27.0 | HTTP client |

### 🟢 Backend — Node.js (`backend/package.json`)

| Package | Version | Role |
|---|---|---|
| `express` | ^5.2.1 | HTTP framework |
| `mongoose` | ^9.6.1 | MongoDB ODM |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT authentication |
| `cors` | ^2.8.6 | CORS middleware |
| `multer` | ^2.1.1 | Multipart file handling |
| `node-fetch` | ^2.7.0 | HTTP requests to AI service |
| `form-data` | ^4.0.5 | FormData for file forwarding |

### ⚛️ Frontend — React (`frontend/package.json`)

| Package | Version | Role |
|---|---|---|
| `react` | ^19.2.4 | UI framework |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `react-router-dom` | ^7.13.2 | Client-side routing |
| `@vladmandic/face-api` | ^1.7.15 | In-browser face detection |
| `face-api.js` | ^0.22.2 | Legacy face-api support |
| `@tensorflow/tfjs` | ^4.22.0 | TensorFlow.js (face-api backend) |
| `axios` | ^1.16.0 | HTTP client |
| `gsap` | ^3.15.0 | Animations |
| `vite` | ^8.0.1 | Build tool / dev server |
| `tailwindcss` | ^4.2.2 | CSS utility framework |

---

## 🗃️ Database Schema

### `users` collection

```js
{
  name:       String,        // required
  email:      String,        // required, unique
  password:   String,        // bcrypt hashed
  embeddings: [[Number]],    // array of ArcFace 512-dim embeddings
  embedding:  [Number],      // legacy single embedding (backward compat)
  notes:      String,        // free-form notes
  relation:   String         // relationship to the patient
}
```

### `memories` collection

```js
{
  ownerId:          ObjectId,   // ref → User (optional)
  name:             String,     // visitor name (required)
  relation:         String,     // relationship label
  event:            String,     // visit description / AI summary (legacy)
  lastConversation: String,     // full raw STT transcript
  context:          String,     // AI-generated memory summary (phi3)
  faceDescriptor:   [Number],   // ArcFace embedding for this visitor
  createdAt:        Date,
  updatedAt:        Date
}
```

---

## ⚙️ Prerequisites

Ensure the following are installed and running before starting:

| Requirement | Version / Notes |
|---|---|
| **Node.js** | v18+ |
| **Python** | 3.10+ |
| **MongoDB** | Running locally on `localhost:27017`, database `face` |
| **Ollama** | Installed and running with `phi3` model pulled |

---

## 🏃 Running the Application

> All three services must run simultaneously in **separate terminals**.

### 1. 🐍 AI Services (FastAPI — port 8000)

```powershell
cd ai-services

# First-time: create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
# OR using uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> **API will be live at:** `http://localhost:8000`
> **Docs (Swagger UI):** `http://localhost:8000/docs`

---

### 2. 🟢 Backend (Node.js Express — port 5000)

```powershell
cd backend

# Install dependencies (first time)
npm install

# Start the server
node index.js
```

> **API will be live at:** `http://localhost:5000`

---

### 3. ⚛️ Frontend (React + Vite — port 5173)

```powershell
cd frontend

# Install dependencies (first time)
npm install

# Start the dev server
npm run dev
```

> **App will be live at:** `http://localhost:5173`

---

### 4. 🦙 Ollama (LLM — port 11434)

```powershell
# Pull the phi3 model (first time only)
ollama pull phi3

# Start Ollama server (if not already running as a service)
ollama serve
```

> Conversation summaries are generated via `http://localhost:11434/api/generate`

---

## 🔄 API Reference

### AI Service (Python — port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — returns model status |
| `POST` | `/embed` | Accepts a face image, returns ArcFace 512-dim embedding |
| `WS` | `/ws/stt` | WebSocket: streams raw PCM audio, returns real-time transcripts |

### Backend (Node.js — port 5000)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/recognize` | Forward image to AI, match embedding in DB |
| `POST` | `/api/match-face` | Match raw embedding against users + memories |
| `POST` | `/update-user` | Update user name/notes by ID |
| `POST` | `/api/memory` | Register a new visitor memory |
| `GET` | `/api/memories` | Fetch all archived memories |
| `GET` | `/api/memory/:name` | Get last memory/context for a visitor by name |
| `POST` | `/api/update-context` | Save transcript + generate AI summary via Ollama |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login and receive JWT token |

---

## 🌐 Frontend Routes

| Path | Page | Description |
|---|---|---|
| `/` | → `/login` | Redirect to login |
| `/login` | `Login.jsx` | User authentication |
| `/register` | `Register.jsx` | New user registration |
| `/dashboard` | `LivingRoom.jsx` | Main face recognition + STT interface |
| `/dashboard/visitors` | `VisitorArchive.jsx` | Browse all visitor memories |
| `/dashboard/voice` | `VoiceAsk.jsx` | Voice-based Q&A |
| `/dashboard/profile` | `Profile.jsx` | User profile management |

---

## 🔑 Key Features

- **🎭 Real-time Face Recognition** — In-browser detection (face-api.js) triggers server-side ArcFace matching; multi-embedding storage for improved accuracy over time.
- **🎙️ Live Speech Transcription** — Raw PCM audio streamed over WebSocket to Faster-Whisper; partial results appear in real-time with 3-second inference windows and 300ms context overlap.
- **🧠 AI Memory Summaries** — Conversation transcripts are cleaned (filler-word removal, deduplication) and summarized by the local `phi3` LLM; fallback summary is used if Ollama is unavailable.
- **📖 Visitor Archive** — Persistent memory cards for each known visitor, showing relationship, last visit context, and AI summary.
- **🔐 JWT Authentication** — Secure login/register system with bcrypt password hashing.
- **🖥️ Fully Local** — No cloud APIs required; all models run on-device.

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 4, React Router 7, GSAP |
| Backend | Node.js, Express 5, Mongoose, JWT, Multer |
| AI Service | Python, FastAPI, InsightFace (ArcFace), Faster-Whisper |
| Database | MongoDB (local, `face` DB) |
| Local LLM | Ollama — `phi3` model |
| Face Detection (browser) | face-api.js / @vladmandic/face-api + TensorFlow.js |
| STT | Faster-Whisper `medium.en` (int8, CPU) |
| Face Embedding | InsightFace `buffalo_l` ArcFace (ONNX, CPU) |
