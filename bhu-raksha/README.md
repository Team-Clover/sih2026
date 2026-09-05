# Bhu Raksha

Citizen-facing landslide safety application for North-East India.

## Run

```powershell
cd bhu-raksha
Copy-Item .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the Node API. The frontend uses HTTP-only cookie sessions and never connects to MongoDB directly.

## Features

- Signup, login, logout, and protected routes
- Current-area alert view with all-clear state when no API alert exists
- Alert list/detail pages
- Safety guidance and local emergency-kit checklist
- Emergency contacts and SOS confirmation flow
- Mobile bottom navigation and Capacitor-safe area spacing
- Regional map-safe fallback that never fabricates markers

## Architecture

React -> Express API (`:5000`) -> MongoDB. The existing FastAPI model remains separate on `:8001`; admin prediction ingestion uses the server-only `ADMIN_API_SECRET` endpoint.

For Android, replace `VITE_API_BASE_URL` with a reachable deployed or LAN API URL. `127.0.0.1` inside a device does not point to the development computer.
