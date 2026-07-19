# Videotube

Videotube is an online video sharing and microblogging platform.

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + MongoDB

## Local Run (JavaScript only)

### 1. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 2. Environment setup

Backend uses `backend/.env`.

Required keys:

- `PORT` (example: `8000`)
- `MONGODB_URI`
- `CORS_ORIGIN` (local example: `http://localhost:5173,http://127.0.0.1:5173`)
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### 3. Start backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:8000`.

### 4. Start frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Connection Notes

- Frontend dev server proxies `/api/*` to backend `http://localhost:8000`.
- Backend CORS is configured for local frontend origins with credentials.
- Auth cookies are secure in production and `lax` in local development.

## Common Issues

- If login requests fail in browser, confirm backend is running on port `8000`.
- If API calls fail, confirm frontend is running with Vite (`npm run dev`) and not a static file server.
- If MongoDB fails to connect, verify `MONGODB_URI`.