# Cryptiq API

Backend server for the Cryptiq neural trading platform.

## Tech Stack

- **Express** — API framework
- **PostgreSQL** — Database (hosted on Railway)
- **JWT + bcrypt** — Authentication
- **Node.js 20+** — Runtime

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Railway provides `DATABASE_URL` automatically when you link a Postgres service.

Set `JWT_SECRET` to a long random string:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run database migration

```bash
npm run db:migrate
```

This creates all 10 tables: users, exchange_connections, wallet_connections, bots, bot_reviews, subscriptions, bot_assignments, trades, portfolio_snapshots, user_settings.

### 4. Start the server

```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Sign in |
| GET | /api/auth/me | Yes | Get current user + settings |
| PATCH | /api/auth/profile | Yes | Update display name, avatar |
| PATCH | /api/auth/settings | Yes | Update preferences |
| POST | /api/auth/change-password | Yes | Change password |

### Marketplace (Bots)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/bots | No | List published bots |
| GET | /api/bots/:slug | No | Bot detail + reviews |
| POST | /api/bots/:id/subscribe | Yes | Subscribe to a bot |
| POST | /api/bots/:id/review | Yes | Rate & review a bot |

### Bot Assignments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/assignments | Yes | List your assignments |
| POST | /api/assignments | Yes | Assign bot to coin |
| PATCH | /api/assignments/:id/status | Yes | Pause/resume/stop |
| PATCH | /api/assignments/:id | Yes | Update config |
| DELETE | /api/assignments/:id | Yes | Remove assignment |

### Connections
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/connections/exchanges | Yes | List exchange APIs |
| POST | /api/connections/exchanges | Yes | Add exchange API |
| DELETE | /api/connections/exchanges/:id | Yes | Remove exchange |
| GET | /api/connections/wallets | Yes | List wallets |
| POST | /api/connections/wallets | Yes | Add wallet |
| DELETE | /api/connections/wallets/:id | Yes | Remove wallet |

### Portfolio
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/portfolio | Yes | Full portfolio overview |
| GET | /api/portfolio/history | Yes | Value over time |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Server status |

## Railway Deployment

1. Push this repo to GitHub
2. Create a new service in Railway, connect the repo
3. Add a Postgres service and link it (gives you DATABASE_URL)
4. Add environment variables: `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
5. Railway auto-detects `npm start` as the start command
6. Run migration: in Railway shell, run `npm run db:migrate`

## TODO (Next Steps)

- [ ] AES-256 encryption for stored API keys
- [ ] Stripe/crypto payment integration for subscriptions
- [ ] Bot signal webhook receiver
- [ ] Trade execution engine (Binance API)
- [ ] WebSocket server for real-time updates
- [ ] Email verification flow
- [ ] Redis for session/rate-limit store
