# PulseGen — Video Upload, Sensitivity Processing & Streaming Platform

A comprehensive full-stack web application for uploading, analysing, and securely streaming videos with real-time sensitivity classification and role-based access control.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, bcryptjs, Multer |
| **Frontend** | React 18 + Vite, Tailwind CSS v3, Axios, Socket.io Client, Recharts |
| **Database** | MongoDB Atlas |
| **Deployment** | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
pulsegen/
├── backend/
│   ├── src/
│   │   ├── config/           # MongoDB connection (db.js)
│   │   ├── controllers/      # authController.js, videoController.js
│   │   ├── middleware/       # JWT auth + RBAC (auth.js)
│   │   ├── models/           # User.js, Video.js (Mongoose schemas)
│   │   ├── routes/           # auth.routes.js, video.routes.js
│   │   ├── services/         # sensitivityProcessor.js
│   │   └── index.js          # Entry point — Express + Socket.io server
│   ├── uploads/              # Local video storage (auto-created on start)
│   ├── .env.example          # Environment variable template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/              # axios.js (HTTP client + JWT interceptors)
    │   ├── context/          # AuthContext.jsx, SocketContext.jsx
    │   ├── pages/            # Login, Register, Dashboard, Upload, Library, VideoPlayer
    │   ├── components/       # Layout, Sidebar, VideoCard, StatusBadge, ProtectedRoute
    │   └── App.jsx           # Routes + providers
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Quick Start (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Git](https://git-scm.com)
- [MongoDB Atlas](https://cloud.mongodb.com) free account

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/pulsegen.git
cd pulsegen

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Backend Environment

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=5000
NODE_ENV=development

# Get from MongoDB Atlas → Cluster → Connect → Drivers
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/videodb?retryWrites=true&w=majority

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<your_generated_secret>
JWT_EXPIRE=7d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### 3. Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## API Reference

**Base URL (local):** `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | ❌ | Any | Create new account |
| POST | `/auth/login` | ❌ | Any | Login and receive JWT token |
| GET | `/auth/me` | ✅ | Any | Get current user profile |

### Videos

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/videos/upload` | ✅ | Editor, Admin | Upload a video file (max 500 MB) |
| GET | `/videos` | ✅ | Any | List videos (filter / search / paginate) |
| GET | `/videos/stats` | ✅ | Any | Dashboard statistics |
| GET | `/videos/:id` | ✅ | Any | Get single video metadata |
| GET | `/videos/stream/:id` | ✅* | Any | Stream video (HTTP Range Requests) |
| POST | `/videos/:id/view` | ✅ | Any | Record a view (called on play) |
| DELETE | `/videos/:id` | ✅ | Editor, Admin | Delete video + remove file from disk |
| GET | `/health` | ❌ | Any | Server health check |

> *`?token=JWT` query param accepted for HTML5 `<video>` tag compatibility*

---

## Socket.io Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `processing:start:{id}` | `{ videoId, message }` | Sensitivity analysis started |
| `processing:progress:{id}` | `{ videoId, progress, step }` | Stage update (0–100%) |
| `processing:complete:{id}` | `{ videoId, status, sensitivityScore, sensitivityDetails }` | Final result |
| `processing:error:{id}` | `{ videoId, error }` | Processing failed |

---

## Role-Based Access Control

| Role | Dashboard | Library | Upload | Delete | See All Videos |
|------|-----------|---------|--------|--------|----------------|
| **Viewer** | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ (own) | ✅ | ✅ (own) | ❌ |
| **Admin** | ✅ | ✅ (all) | ✅ | ✅ (any) | ✅ |

Role is selected during registration and enforced on every protected route.

---

## Sensitivity Analysis

Videos are automatically scored across 3 categories after upload:

```
sensitivityScore = (violence × 0.4) + (adult × 0.4) + (hate × 0.2)
```

| Score | Status |
|-------|--------|
| ≤ 0.38 | ✅ Safe |
| > 0.38 | 🚩 Flagged |

Results are pushed to the frontend in real-time via Socket.io.

---

## Security

- Passwords hashed with **bcryptjs** (salt rounds: 12) via Mongoose `pre('save')` hook
- JWT tokens signed with a 512-bit secret — stored in `localStorage`
- Every protected route verified by `protect` middleware
- Role-based `authorize()` guard on sensitive endpoints
- CORS restricted to `CLIENT_URL` environment variable only
- `.env` excluded from Git via `.gitignore`

---

## Deployment

### Backend → Render.com

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| `PORT` | set automatically by Render |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI |
| `JWT_SECRET` | your generated secret |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | `https://your-app.vercel.app` |

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| `VITE_API_URL` | `https://your-render-backend.onrender.com/api` |

> ⚠️ After deploying both, update `CLIENT_URL` on Render with your Vercel URL and redeploy.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `EADDRINUSE: port already in use` | Another process is on that port — kill it or change `PORT` in `.env` |
| `MongoDB connection failed` | Check `MONGODB_URI` and whitelist your IP in Atlas Network Access |
| `Registration / Login failed` | Make sure **backend is running** on port 5000 |
| Videos not streaming | Check `uploads/` folder exists and file path is correct in DB |
| Views not counting | View is recorded on **play button press**, not on page load |

---

## Features

- 🔐 **JWT Authentication** with bcrypt password hashing
- 👥 **Role-Based Access Control** (Viewer / Editor / Admin)
- 🏢 **Multi-Tenant Isolation** — users see only their own content
- 🎬 **Drag-and-drop upload** (MP4, AVI, MKV, MOV, WebM — up to 500 MB)
- 🧠 **Automated sensitivity analysis** (violence, adult content, hate speech)
- 📡 **Real-time progress updates** via Socket.io WebSocket
- 📺 **HTTP Range Request streaming** with seek support
- 👁️ **Accurate view counting** — recorded only on actual play, not page load
- 📊 **Analytics Dashboard** with Recharts charts and stat cards
- 🔍 **Filtering & Search** by status and title
- 📄 **Pagination** with configurable page size
- 🌙 **Premium dark UI** with glassmorphism and micro-animations
