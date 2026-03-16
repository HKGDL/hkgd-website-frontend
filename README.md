# HKGD Website

A Geometry Dash Demon List website for the Hong Kong GD community.

## Project Structure

```
app/
├── api/           # Express.js backend server
│   ├── server.js  # Main server file
│   ├── hkgd.db    # SQLite database
│   └── certs/     # SSL certificates (generated)
└── frontend/      # React + Vite frontend
    └── src/       # Source code
```

## Prerequisites

- Node.js >= 18.0.0
- npm

## Quick Start

### 1. Install Dependencies

```bash
# Install API dependencies
cd app/api
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cd app/api
cp .env.example .env
```

Edit `.env` with your settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `hkgd-secret-key-2024` |
| `ADMIN_PASSWORD` | Admin panel password | `hkgdadmin2024` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:5173,https://hkgdl.ddns.net` |
| `SSL_KEY_PATH` | Path to SSL key file | `./certs/key.pem` |
| `SSL_CERT_PATH` | Path to SSL certificate | `./certs/cert.pem` |
| `HTTPS_PORT` | Server port | `19132` |
| `TRUST_PROXY` | Set `true` if behind reverse proxy | `false` |

### 3. Generate SSL Certificates (for HTTPS)

```bash
cd app/api
chmod +x generate-certs.sh
./generate-certs.sh
```

This creates self-signed certificates in `api/certs/`.

### 4. Build the Frontend

```bash
cd app/frontend
npm run build
```

This outputs to `app/api/dist/` (served by the backend).

### 5. Start the Server

```bash
cd app/api
npm start
```

The server will start on `https://localhost:19132` (or your configured port).

## Development Mode

For development with hot reload:

```bash
# Terminal 1: Start frontend dev server
cd app/frontend
npm run dev

# Terminal 2: Start API server
cd app/api
npm run dev
```

- Frontend dev server: `http://localhost:5173`
- API server: `https://localhost:19132`

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/levels` | Get all levels |
| GET | `/api/levels/:id` | Get single level |
| GET | `/api/members` | Get all members |
| GET | `/api/changelog` | Get changelog |
| GET | `/api/content` | Get website content |
| GET | `/api/platformer-demons` | Get platformer demons |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with password |
| POST | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/logout` | Logout |

### Admin Endpoints (requires authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/levels` | Create level |
| PUT | `/api/levels/:id` | Update level |
| DELETE | `/api/levels/:id` | Delete level |
| POST | `/api/levels/:id/records` | Add record |
| POST | `/api/changelog` | Add changelog entry |
| DELETE | `/api/changelog/:id` | Delete changelog entry |
| POST | `/api/content` | Save website content |

## Security Features

- HTTPS with SSL certificates
- JWT-based authentication
- Rate limiting on API endpoints
- IP ban after 5 failed login attempts (15 min ban)
- Helmet.js security headers
- CORS protection

## Database

Uses SQLite (`better-sqlite3`) with the following tables:

- `levels` - Demon levels
- `records` - Player records
- `changelog` - List changes
- `members` - Community members
- `pending_submissions` - User submissions

## Production Deployment

1. Set strong `JWT_SECRET` and `ADMIN_PASSWORD` in `.env`
2. Update `ALLOWED_ORIGINS` with your production domain
3. Set `TRUST_PROXY=true` if behind nginx/cloudflare
4. Use proper SSL certificates (not self-signed)
5. Build frontend: `npm run build`
6. Start server: `npm start`
