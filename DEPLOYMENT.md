# Deploying TECHNO QUIZ from GitHub

Because **TECHNO QUIZ** uses WebSockets (`/ws`) for instant real-time buzzer synchronization across devices, it needs a hosting platform that supports Node.js web services with active WebSocket connections (rather than static-only hosts like GitHub Pages or Vercel static).

Here are the fastest, free/low-cost deployment options:

---

## Option 1: Render.com (Recommended — 2 Minutes, Free Tier)

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your GitHub repository (`techno-quiz`).
4. Set the following settings:
   - **Name:** `techno-quiz`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Click **Create Web Service**.
6. Render gives you an **`https://your-app.onrender.com`** URL with automatic SSL and WebSocket support. Anyone on any laptop or phone worldwide can join using that URL!

---

## Option 2: Railway.app (Automatic Nixpacks / Docker)

1. Go to [railway.app](https://railway.app) and log in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Choose your repository.
4. Railway will automatically use the included `railway.toml` or `Dockerfile`:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Go to **Settings** → **Networking** → Click **Generate Domain**.
6. Railway automatically routes HTTPS and WebSockets to your application.

### Fixing Railway Build / Start Errors:
- **Port:** Railway automatically sets the `PORT` environment variable. The server now dynamically listens to `process.env.PORT`.
- **Start Command:** Uses `npm start` (`node dist/server.js`), which runs native Node with zero tsx dev-dependency conflicts.
- **Healthcheck:** Preconfigured in `railway.toml` pointing to `/api/game/state`.

---

## Option 3: Fly.io

If you prefer deploying via CLI or Docker:
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` in your repository.
3. Choose a name and region.
4. Run `fly deploy`.

---

## Option 4: Deploy with Docker (Self-Hosted VPS, DigitalOcean, AWS, or Local Server)

A ready-to-use Dockerfile is provided below. You can build and run it anywhere:

```bash
docker build -t techno-quiz .
docker run -p 3000:3000 -e NODE_ENV=production techno-quiz
```

---

## Deployment Configuration Summary

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Port** | Assigned automatically via `process.env.PORT` (defaults to `3000`) |
| **WebSockets** | Enabled on path `/ws` |
| **Node Version** | Node 18+ |
