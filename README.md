# VideoVault — Video Upload, Sensitivity Processing & Streaming Platform

A comprehensive full-stack web application for uploading, analysing, and securely streaming videos with real-time sensitivity classification and role-based access control.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, Multer |
| **Frontend** | React 18 + Vite, Tailwind CSS v3, Axios, Socket.io Client, Recharts |
| **Database** | MongoDB Atlas |
| **Deployment** | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
videovault/
├── backend/
│   ├── src/
│   │   ├── config/           # MongoDB connection (db.js)
│   │   ├── controllers/      # authController.js, videoController.js
│   │   ├── middleware/       # JWT auth + RBAC (auth.js)
│   │   ├── models/           # User.js, Video.js (Mongoose schemas)
│   │   ├── routes/           # auth.routes.js, video.routes.js
│   │   ├── services/         # sensitivityProcessor.js (AI pipeline)
│   │   └── index.js          # Entry point — Express + Socket.io server
│   ├── uploads/              # Local video storage (auto-created)
│   ├── .env                  # Environment variables (DO NOT commit)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/              # axios.js (HTTP client + interceptors)
    │   ├── context/          # AuthContext.jsx, SocketContext.jsx
    │   ├── pages/            # Login, Register, Dashboard, Upload, Library, Player
    │   ├── components/       # Layout, VideoCard, StatusBadge, ProtectedRoute
    │   └── App.jsx           # Routes + providers
    ├── .env.local            # Frontend env (VITE_API_URL)
    └── package.json
```

---

## Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/videovault.git
cd videovault

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Backend Environment

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/videodb?retryWrites=true&w=majority
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 3. Start Backend

```bash
cd backend
npm run dev   # uses nodemon for hot reload
# → http://localhost:5000
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## API Reference

**Base URL:** `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | ❌ | Any | Create new account |
| POST | `/auth/login` | ❌ | Any | Login and get JWT token |
| GET | `/auth/me` | ✅ | Any | Get current user profile |

### Videos

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/videos/upload` | ✅ | Editor, Admin | Upload a video file |
| GET | `/videos` | ✅ | Any | List videos (with filter/search/page) |
| GET | `/videos/stats` | ✅ | Any | Dashboard statistics |
| GET | `/videos/:id` | ✅ | Any | Get single video details |
| GET | `/videos/stream/:id` | ✅* | Any | Stream video (range requests) |
| DELETE | `/videos/:id` | ✅ | Editor, Admin | Delete video + file |
| GET | `/health` | ❌ | Any | Server health check |

*`?token=JWT` query param accepted (HTML5 video tag compatibility)*

---

## Socket.io Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `processing:start:{id}` | `{ videoId, message }` | Analysis started |
| `processing:progress:{id}` | `{ videoId, progress, step }` | Stage update (0–100%) |
| `processing:complete:{id}` | `{ videoId, status, sensitivityScore, sensitivityDetails }` | Final result |
| `processing:error:{id}` | `{ videoId, error }` | Processing failed |

---

## Role-Based Access Control

| Role | Dashboard | Library | Upload | Delete | See All Users |
|------|-----------|---------|--------|--------|---------------|
| **Viewer** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ (any) | ✅ |

---

## Sensitivity Analysis

Videos are scored across 3 categories with a weighted composite:

```
sensitivityScore = (violence × 0.4) + (adult × 0.4) + (hate × 0.2)
```

| Score | Classification |
|-------|---------------|
| ≤ 0.38 | ✅ Safe |
| > 0.38 | 🚩 Flagged |

---

## Deployment

| Service | Platform | URL Pattern |
|---------|----------|------------|
| Backend | Render.com | `https://videovault-backend.onrender.com` |
| Frontend | Vercel | `https://videovault.vercel.app` |
| Database | MongoDB Atlas | Cloud (free tier) |

See [documentation.md](./DOCS.md) for full step-by-step deployment instructions.

---

## Features

- 🔐 **JWT Authentication** with secure token signing
- 👥 **Role-Based Access Control** (Viewer / Editor / Admin)
- 🏢 **Multi-Tenant Isolation** — users see only their own content
- 🎬 **Drag-and-drop upload** (MP4, AVI, MKV, MOV, WebM — up to 500 MB)
- 🧠 **Automated sensitivity analysis** (violence, adult content, hate speech)
- 📡 **Real-time progress updates** via Socket.io WebSocket
- 📺 **HTTP Range Request streaming** for smooth video playback
- 📊 **Analytics Dashboard** with Recharts pie charts and stat cards
- 🔍 **Filtering & Search** by status and title
- 📄 **Pagination** with configurable page size
- 🌙 **Premium dark UI** with glassmorphism and animations
