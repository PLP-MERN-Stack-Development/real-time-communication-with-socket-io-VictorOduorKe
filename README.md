# Real-Time Chat Application with Socket.io

This assignment focuses on building a real-time chat application using Socket.io, implementing bidirectional communication between clients and server.

## Assignment Overview

You will build a chat application with the following features:
1. Real-time messaging using Socket.io
2. User authentication and presence
3. Multiple chat rooms or private messaging
4. Real-time notifications
5. Advanced features like typing indicators and read receipts

## Project Structure

```
socketio-chat/
├── client/                 # React front-end
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── socket/         # Socket.io client setup
│   │   └── App.jsx         # Main application component
│   └── package.json        # Client dependencies
├── server/                 # Node.js back-end
│   ├── config/             # Configuration files
│   ├── controllers/        # Socket event handlers
│   ├── models/             # Data models
│   ├── socket/             # Socket.io server setup
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file

# Realtime Chat App (Socket.IO + React + Express + MongoDB)

A real-time chat application built with React (Vite), Express, Socket.IO, and MongoDB. The project includes a frontend React client and an Express-based backend with REST APIs and Socket.IO for real-time messaging. The app supports attachments (uploads), group chats, typing indicators, message read receipts, and presence.

This repository contains two main folders:

- `client/` — React Vite application (UI, socket client, axios instance)
- `server/` — Express server (API, socket handlers, uploads, database)

Status: frontend is hosted on Netlify, backend hosted on Render (as reported by the project owner). This README covers local setup, environment variables, running, building, deployment notes, and a quick checklist for production readiness.

---

## Table of Contents

- Project overview
- Repo structure
- Prerequisites
- Environment variables
- Local setup (server and client)
- Running locally (development)
- Building for production
- Deploying (Netlify for front-end, Render for backend)
- How to remove or disable `console.log` before production
- Troubleshooting
- Next steps / recommendations

---

## Project overview

This project implements a real-time chat application featuring:

- Real-time messaging with Socket.IO
- REST endpoints for fallback and CRUD operations
- File uploads for message attachments
- Presence (online/offline) and typing indicators
- Read receipts
- Group and 1:1 chats

The backend persists data (MongoDB), broadcasts events via Socket.IO, and serves uploaded files.

---

## Repo structure (high level)

```
README.md
client/
  ├─ public/
  ├─ src/
  │  ├─ api/            # axios instance and API wrappers
  │  ├─ components/     # React components (ChatRoom, MessageInput, NavBar, etc.)
  │  ├─ context/        # Auth and Socket contexts
  │  └─ main.jsx
  └─ package.json
server/
  ├─ config/           # db.js etc.
  ├─ controllers/
  ├─ middleware/
  ├─ models/
  ├─ routes/
  ├─ socket/
  ├─ uploads/          # uploaded files
  └─ server.js
```

---

## Prerequisites

- Node.js (v16+ recommended)
- npm (or yarn)
- MongoDB (local or cloud like Atlas) — ensure a connection string is available
- Optional: `ngrok` or equivalent for testing webhooks from remote devices

---

## Environment variables

Create `.env` files for server and optionally for client (Vite uses `VITE_` prefix for client env vars).

Server (`server/.env`):

```
PORT=5000
MONGO_URI=<your_mongo_connection_string>
JWT_SECRET=<your_jwt_secret>
CLIENT_URL=http://localhost:5173   # or your deployed frontend URL (Netlify)
ENABLE_GPT5_MINI=false            # optional feature flag used in project
```

Client (`client/.env` or set in Netlify env):

```
VITE_SERVER_URL=http://localhost:5000
# set to the deployed server URL in production (Render)
```

Notes:
- The client builds requests to `${VITE_SERVER_URL}` (check `axiosInstance.js`).
- The server uses `CLIENT_URL` for CORS settings.

---

## Local setup (one-time)

1. Clone the repo and cd into it.

2. Install dependencies for server and client:

```bash
# from repo root
cd server
npm install

# in a separate terminal
cd ../client
npm install
```

3. Create `.env` files and set variables as listed above.

4. Ensure `server/uploads` directory exists. Example (from repo root):

```bash
mkdir -p server/uploads
chmod 755 server/uploads
```

---

## Running locally (development)

Start server (from `server/`):

```bash
cd server
# either
npm run dev    # if a dev script exists (e.g. nodemon)
# or
node server.js
```

Start client (from `client/`):

```bash
cd client
npm run dev
```

Open the frontend (Vite will print the dev URL, usually `http://localhost:5173`).

Notes:
- When running locally, make sure `VITE_SERVER_URL` points to your server (e.g. `http://localhost:5000`).
- If you change environment variables, restart the server and the client.

---

## Building for production

Client (build static assets):

```bash
cd client
npm run build
```

This produces a `dist/` folder (Vite) ready for Netlify or any static hosting.

Server: ensure you build or run the server under a process manager (PM2) or deploy to a platform like Render. Make sure you set the proper environment variables on the host (Mongo URI, JWT secret, CORS origin).

---

## Deploying

Frontend (Netlify):
- Connect your GitHub repo to Netlify (or drag-and-drop the `dist` folder).
- Set environment variable `VITE_SERVER_URL` in Netlify to your backend URL (the Render app URL) so the client hits the deployed API.
- Build command: `npm run build` (or `yarn build`)
- Publish directory: `dist`

 # visit live site
 [Visit here](https://real-time-communications.netlify.app/chat)

Backend (Render):
- Create a Web Service on Render, connect repo, set `server/` as the service directory or the start command to `node server/server.js` depending on how you structure repo in Render.
- Set environment variables in Render dashboard (MONGO_URI, JWT_SECRET, CLIENT_URL set to Netlify URL, etc.)
- Ensure the `uploads` directory is either stored in a managed storage (S3) or persisted using Render's persistent disks (Render has an option) — otherwise upload files may be lost on redeploy.

Important:
- If you use server-side serving for uploads, verify the server serves `/uploads` and/or `/api/uploads` (server in this repo supports both). Ensure CORS and path prefixes are consistent with how attachments URLs are stored.

---

## Removing or disabling console.log in client (recommended before pushing)

Two safe approaches:

1) Disable logs at runtime by gating them behind NODE_ENV (preferred):

- Replace calls like `console.log(...)` with:

```js
if (process.env.NODE_ENV !== 'production') {
  console.log(...)
}
```

- Or create a small logger wrapper (e.g. `src/utils/logger.js`) and call `logger.log(...)` which no-ops in production.

2) Remove them automatically (risky; recommended to review diffs):

- To find logs in the client codebase:

```bash
# from repo root
## Resources
```

- To comment out all `console.log` occurrences in the `client/src` folder (preview first):

```bash
# preview changes


# to create a patch (DRY RUN) you can use perl to comment them out - make a backup first
# WARNING: This modifies code. Commit or stash first.

# Example (comment out console.log lines in-place) - run from repo root
find client/src -type f -name "*.js*" -print0 | xargs -0 perl -0777 -pe "s/(^|\n)(\s*)console\.log\(/\1\2\/\/ console.log(/g" -i.bak

# This creates .bak files and comments out occurrences - inspect diffs and remove .bak after verification
```

- Safer: use an ESLint rule to error on console statements in CI (e.g., `no-console`), then fix them manually.

---

## Quick troubleshooting

- Image attachments not loading: verify `uploads` folder contains the file and that the server exposes the correct path. If the client stores attachment paths like `/uploads/...` and the server serves at `/api/uploads` or vice-versa, ensure the paths match or that the server serves both endpoints.
- CORS: ensure `CLIENT_URL` is set on the server and matches the front-end origin.
- Socket connection issues: check the Socket.IO client `VITE_SERVER_URL` and the server CORS config. Also ensure the server is listening and accessible from the client network.

---

## Next steps / recommendations

- Add linting (ESLint) and a `no-console` rule enabled for production builds.
- Add a CI pipeline to run tests and a build step.
- Consider uploading attachments to a cloud object store (S3 / DigitalOcean Spaces) instead of local uploads to avoid loss on redeploy.
- Add health checks and monitoring for the backend service (Render provides built-in health checks).

---

If you want, I can also:

- Run a scan to detect all `console.log` usages and either comment them out or create a branch with fixes.
- Add a small `logger` helper to centralize logging and automatically strip logs in production.

If you'd like me to remove client-side `console.log` calls automatically, tell me and I'll either create a patch or perform careful, reviewed edits. Otherwise, this README is ready to use and include in your repo.
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Building a Chat Application with Socket.io](https://socket.io/get-started/chat) 