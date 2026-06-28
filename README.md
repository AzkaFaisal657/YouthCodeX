# Tether

> A focus ritual for brains that freeze before they begin.

**Tether** is an AI-powered focus companion built for students and adults with ADHD or brain fog. Instead of asking you to "just focus," Tether meets you exactly where you are — learning your brain's patterns through a short onboarding conversation, then recommending the right sound environment, a tiny first step, and personalized framing to help you break through the moment of avoidance.

🔗 **Live App:** [https://youth-code-x--musferahnasar38.replit.app](https://youth-code-x--musferahnasar38.replit.app)

---

## The Problem

Executive dysfunction isn't a willpower failure. For many brains, the gap between "knowing what to do" and "starting it" feels impossible to cross — especially under shame, fatigue, or cognitive overload. Generic productivity tools don't account for this. Tether does.

---

## Features

### 🧠 AI-Powered Onboarding
A short (3–5 question) conversational onboarding builds a personal **focus profile** for each user. The AI identifies:
- **Brain mode** — whether your stuck-brain tends to feel scattered/racing or foggy/heavy
- **Crash time** — what time of day focus typically breaks down
- **Stall type** — whether you freeze before starting, or drift away mid-task

### ⚡ Adaptive Session Recommendations
Each check-in takes two inputs (current energy level + the task you're avoiding) and returns three things in seconds:
- **Sound type** — brown noise for scattered states, pink noise for foggy states, binaural beats for mixed states
- **Micro-action** — one impossibly small first step designed to slip past the freeze response
- **Brain framing** — 1–2 sentences written for your specific stall pattern, not generic cheerleading

### 🎵 Local Audio Engine
All sound is generated in real time using the **Web Audio API** — no external files, no buffering. Brown noise, pink noise, and binaural beats are synthesized directly in the browser.

### 🔄 Shame Loop Detection
Tether tracks when the same task keeps appearing across sessions. After two repeats it acknowledges the pattern directly. After three or more, it switches to a "shame loop" intervention — making the micro-action absurdly tiny and reframing the block as an emotional pattern, not a productivity failure.

### 📊 Pattern Insights
After multiple sessions, the AI analyzes session history and surfaces:
- Your dominant focus pattern (e.g., "Brown noise works for you 80% of the time")
- Time-of-day trends and task completion rates
- A compassionate strength statement

### 🎙️ Voice Input
Speak your task instead of typing it using the **Web Speech API** (requires HTTPS).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v4, Framer Motion |
| Audio | Web Audio API (synthesized in-browser) |
| Voice | Web Speech API |
| Backend | Node.js, Express |
| AI | Groq API — Llama 3.1 8B Instant |
| Storage | Browser localStorage (no database) |
| Hosting | Replit Autoscale |

---

## Project Structure

```
tether/
├── src/
│   ├── components/
│   │   ├── CheckIn.tsx          # Energy slider + task input
│   │   ├── Onboarding.tsx       # AI-driven profile conversation
│   │   ├── Session.tsx          # Recommendation display + timer
│   │   ├── SoundVisualizer.tsx  # Real-time audio visualizer
│   │   ├── InsightCard.tsx      # Session history insights
│   │   └── Timer.tsx            # Focus countdown
│   ├── lib/
│   │   ├── audio.ts             # Web Audio API engine
│   │   ├── api.ts               # Backend API client
│   │   └── storage.ts           # localStorage helpers
│   ├── pages/
│   │   └── Home.tsx             # Animated landing page
│   ├── App.tsx                  # Main app flow controller
│   ├── Root.tsx                 # Landing ↔ App router
│   └── types.ts                 # Shared TypeScript interfaces
├── server/
│   ├── index.js                 # Express API + static file server
│   └── package.json
├── index.html
├── vite.config.ts
└── package.json
```

---

## App Flow

```
Landing Page
    ↓
Onboarding  ── 3–5 AI questions → focus profile saved to localStorage
    ↓
Check-In  ── energy level (Foggy → Scattered) + task you're avoiding
    ↓
AI Recommendation  ── sound type + micro-action + brain framing
    ↓
Focus Session  ── breathing orb + countdown timer + adaptive sound
    ↓
Reflection  ── "Did you do it?" (Yes / Not quite)
    ↓
Insights  ── pattern analysis after multiple sessions
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier available)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/tether.git
cd tether

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### Environment Setup

Create `server/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Running Locally

```bash
# Terminal 1 — Backend (port 8000)
cd server && node index.js

# Terminal 2 — Frontend (port 5000)
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/onboarding/turn` | One turn in the onboarding conversation |
| `POST` | `/api/session/recommend` | Get a focus session recommendation |
| `POST` | `/api/session/feedback` | Update profile notes after a session |
| `POST` | `/api/insights` | Analyze session history for patterns |

---

## Design Philosophy

- **No shame, no streaks.** Tether never judges a missed session or an avoided task.
- **Smallest possible door.** Every micro-action is designed to be so small the brain doesn't trigger an avoidance response.
- **State-aware, not generic.** Recommendations adapt to your current energy level, not a fixed routine.
- **Local-first.** All data stays in your browser. No accounts, no tracking, no syncing.

---

## Built With

- [Groq](https://groq.com) — ultra-fast LLM inference (Llama 3.1)
- [React](https://react.dev) — UI framework
- [Vite](https://vitejs.dev) — frontend build tool
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling
- [Framer Motion](https://www.framer.com/motion) — animations
- [Replit](https://replit.com) — deployment

---
