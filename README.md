# DSAforge 🔥
### AI-Powered DSA & Interview Preparation Platform

> One platform to track, practice, and ace your technical interviews.

🌐 **Live:** [aiinterview-sepia.vercel.app](https://aiinterview-sepia.vercel.app)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **111 DSA Problems** | Curated problems across 13 topics with company tags |
| 🏢 **Company Patterns** | See which topics Google, Amazon, Meta etc. focus on |
| 🤖 **AI Code Review** | Groq AI grades your code and gives detailed feedback |
| 🎯 **Live AI Interviews** | Real-time mock interviews with AI (DSA / Behavioral / System Design / HR) |
| 📊 **Analytics Dashboard** | Track your progress, weak areas, and activity heatmap |
| 🔥 **Streak System** | Daily streak tracking with midnight auto-reset |
| 📄 **Resume AI Analysis** | Upload PDF → get AI-powered resume feedback |
| 🏆 **Leaderboard** | Compete with other users |
| 💬 **Discussions** | Comment and discuss solutions on every problem |
| 📅 **Daily Challenge** | One new problem every day with countdown timer |
| 🌙 **Dark / Light Mode** | Fully themed UI with persistent preference |
| 📱 **Mobile Responsive** | Works on all screen sizes |

---

## 🛠 Tech Stack

### Frontend
- **React** + **Vite**
- **Monaco Editor** (VS Code-grade code editor)
- **Recharts** (analytics charts)
- **Axios** (API calls)

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (via Neon — serverless)
- **Redis** (via Upstash — caching + rate limiting)
- **Groq AI** (llama-3.3-70b-versatile — free tier)
- **JWT** authentication
- **Helmet + XSS + HPP + Rate Limiting** (security hardened)

### Infrastructure
- **Frontend** → Vercel
- **Backend** → Render
- **Database** → Neon (serverless PostgreSQL)
- **Redis** → Upstash (serverless Redis)

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Redis

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dsaforge
DB_USER=dsaforge_user
DB_PASSWORD=dsaforge_pass
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

```bash
# Run migrations
node src/config/migrate.js

# Seed questions
node src/config/seed.js

# Start server
npm run dev
```

### Frontend Setup

```bash
cd dsaforge
npm install
npm run dev
```

---

## 📁 Project Structure

```
aiinterview/
├── backend/
│   └── src/
│       ├── config/       # DB, Redis, migrations, seed, cron
│       ├── middleware/   # Auth, error handler
│       ├── routes/       # API routes
│       └── services/     # Groq AI, streak logic
└── dsaforge/
    └── src/
        ├── components/   # Reusable components
        ├── pages/        # All page components
        ├── services/     # API calls
        └── styles/       # Global CSS + design system
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/questions` | List questions (filterable) |
| POST | `/api/sessions` | Submit code attempt |
| GET | `/api/analytics/overview` | User stats |
| GET | `/api/analytics/heatmap` | Activity heatmap |
| GET | `/api/leaderboard` | Global leaderboard |
| POST | `/api/resume/analyze` | AI resume analysis |
| POST | `/api/interview/start` | Start live AI interview |
| GET | `/api/daily` | Daily challenge question |

---

## 🌍 Deployment

| Service | Provider | Free Tier |
|---|---|---|
| Frontend | Vercel | ✅ Free |
| Backend | Render | ✅ Free (sleeps after 15min) |
| PostgreSQL | Neon | ✅ Free (0.5GB) |
| Redis | Upstash | ✅ Free (10k req/day) |

---

## 📸 Pages

- **Dashboard** — overview stats, recent activity, quick actions
- **DSA Questions** — 111 problems with search, topic filters, difficulty tabs
- **Code Editor** — Monaco editor with AI feedback, test cases, discussions
- **Analytics** — charts, heatmap, weak topic analysis, AI study plan
- **Mock Interview** — schedule sessions + live AI interviews
- **Resume AI** — PDF upload → detailed AI feedback
- **Daily Challenge** — one problem per day with streak tracking
- **Leaderboard** — global rankings
- **Submission History** — all past attempts with AI feedback

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT

---

Built with ❤️ by [@rishi712004](https://github.com/rishi712004)