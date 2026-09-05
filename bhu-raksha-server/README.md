# Bhu Raksha Server

Express/Mongoose API for citizen authentication, alerts, contacts, saved locations, and SOS events.

## Run

```powershell
cd bhu-raksha-server
Copy-Item .env.example .env
npm install
npm run dev
```

MongoDB must be running and `MONGO_URI` must be configured. `JWT_SECRET` and `ADMIN_API_SECRET` must be long, private values.

The existing FastAPI service must use the same `ADMIN_API_SECRET` and set `CITIZEN_API_URL=http://127.0.0.1:5000`. FastAPI publishes completed admin predictions server-to-server; the citizen browser never receives the admin secret.

## API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/alerts`, `/active`, `/unread`
- `PATCH /api/alerts/:id/read`, `/api/alerts/read-all`
- `POST /api/predictions` with `x-admin-api-secret` (server-side admin integration)
- `GET/PATCH /api/users/profile`
- `GET/POST/DELETE /api/contacts`
- `GET/POST/DELETE /api/locations`
- `POST /api/sos`, `GET /api/sos/my`

High and very-high prediction ingestion creates an active alert for 24 hours. Citizen clients cannot create or change predictions. `sourceId` makes retries idempotent.
