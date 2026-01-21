# Gatekeeper (Node.js Authentication API)

Authentication system built with **Express**, **MongoDB (Mongoose)**, **Redis**, and **JWT**.

- Access + refresh tokens are issued as **httpOnly cookies**
- Redis is used as a **session store** keyed by JWT `jti` (supports forced logout)
- Role-based admin routes (admin + super-admin)

## Tech stack

- Node.js + Express (v5)
- MongoDB + Mongoose
- Redis (sessions + pub/sub)
- JWT (`jsonwebtoken`)

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` in the project root:

```bash
PORT=3000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://localhost:27017/gatekeeper

JWT_SECRET=change_me_to_a_long_random_string

REDIS_URL=127.0.0.1
REDIS_PORT=6379
# Optional (set if your Redis requires auth)
REDIS_USERNAME=
REDIS_PASSWORD=
```

Notes:

- `CLIENT_URL` must match your frontend origin because CORS is configured with `credentials: true`.
- Cookies will be sent only when your client uses `credentials: "include"`.

### 3) Run the server

Development (auto-reload):

```bash
npm run dev
```

Production:

```bash
npm start
```

The API will be available at `http://localhost:$PORT`.

## Health check

- `GET /health` → `200 OK`

## Authentication model (high level)

- On login, the server sets:
  - `accessToken` (15 minutes)
  - `refreshToken` (1 day or 7 days if `rememberMe=true`)
- Each token includes a `jti` (unique id). Redis stores `session:${userId}:${jti}`.
- Every protected request must include the `accessToken` cookie and have a valid session in Redis.

## API endpoints

Base path: `/api`

### Public

- `POST /api/users` – Create user (signup)
  - Body: `{ first_name, last_name, email, password, role? }`

- `POST /api/auth/login` – Login
  - Body: `{ email, password, rememberMe? }`
  - Sets `accessToken` + `refreshToken` cookies

- `GET /api/auth/refresh-token` – Refresh access token
  - Uses `refreshToken` cookie
  - Sets a new `accessToken` cookie

### Authenticated (requires `accessToken` cookie)

- `GET /api/users` – Get current user (`me`)
- `PATCH /api/users` – Update current user
  - Body: any of `{ first_name, last_name, email, password }`
- `DELETE /api/users` – Deactivate current user and clear cookies
- `GET /api/users/all` – List all users

### Admin only

All admin routes require the authenticated user to have `role=admin`.

- `GET /api/admin/active-sessions` – View active Redis sessions
- `POST /api/admin/force-logout` – Force logout a user
  - Body: `{ userId }`
- `POST /api/admin/promote-user` – Promote a user to admin
  - Body: `{ userId }`
- `POST /api/admin/demote-user` – Demote a user to normal user
  - Body: `{ userId }`
  - Caller must be `isSuperAdmin=true`

## Project structure

- `src/index.js` – Express app bootstrap
- `src/config/` – Mongo/Redis connections + Redis pub/sub
- `src/controllers/` – Route handlers
- `src/routes/` – Express routers
- `src/middlewares/` – Auth + admin authorization
- `src/models/` – Mongoose models
- `src/utils/` – JWT utilities

## Local development tips

- If your client is a browser app, make requests with credentials enabled:
  - `fetch(..., { credentials: "include" })`
  - Axios: `axios.defaults.withCredentials = true`
- For local Redis/Mongo, Docker is convenient:

```bash
# Mongo
docker run --name gatekeeper-mongo -p 27017:27017 -d mongo:7

# Redis
docker run --name gatekeeper-redis -p 6379:6379 -d redis:7
```

## License

See [LICENSE](LICENSE).
