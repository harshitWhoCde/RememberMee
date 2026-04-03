# 🧠 Face Recognition App for Dementia Patients

## 🚀 Tech Stack

* React (Frontend)
* Node.js + Express (Backend)
* FastAPI (AI Service)
* MongoDB

---

## ✨ Features

* Real-time face detection via webcam
* Face recognition using embeddings
* Learning system (multiple embeddings per user)
* User profiles with notes

---

## ⚙️ Setup Instructions

### 1. Clone Repository

git clone <your-repo-url>

---

### 2. Frontend (React)

cd client
npm install
npm start

---

### 3. Backend (Node.js)

cd server
npm install
npm run dev

---

### 4. AI Service (FastAPI)

cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload

---

## 🔐 Environment Variables

Create a `.env` file in `/server`:

MONGO_URI=your_mongodb_uri
PORT=5000

---

## 📌 Future Improvements

* Multi-face recognition
* Better UI/UX
* AI memory system
* Performance optimization
