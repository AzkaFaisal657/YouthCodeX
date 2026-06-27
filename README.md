# Tether — Focus Ritual

## Local development

Run both the backend and frontend on your dev machine:

```bash
# Terminal 1 — API server
cd server
npm install
npm run dev

# Terminal 2 — frontend (from repo root)
npm install
npm run dev
```

The frontend dev server uses **HTTPS** with a self-signed certificate so microphone and focus audio work when you open the app via your LAN IP (not just `localhost`).

### Opening the app

| URL | Mic & audio |
|-----|-------------|
| `https://localhost:5173` | Works |
| `https://192.168.x.x:5173` | Works (use your machine's LAN IP) |
| `http://192.168.x.x:5173` | **Broken** — browser blocks mic on non-secure HTTP |

When you first open an HTTPS URL, the browser will warn about the certificate. Click **Advanced → Continue** (expected for local dev).

### Sound selection

Focus sounds (brown noise, pink noise, or binaural beats) are chosen by the AI when you submit check-in, based on your energy level, profile, and task. Audio **starts when you pick a duration** (10 / 15 / 25 min), not before.
