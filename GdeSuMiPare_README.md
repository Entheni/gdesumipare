# 💸 GdeSuMiPare

**GdeSuMiPare** is a Serbian-language web app that helps users track recurring bills, subscriptions, and overall monthly expenses — giving them clear insight into **where their money goes**.

---

## 🧭 Project Vision

People in Serbia often juggle multiple payments each month (Infostan, EPS, A1, SBB, Yettel, Netflix, parking, etc.) without a central overview.  
**GdeSuMiPare** provides a simple, privacy-focused personal finance dashboard for managing all recurring costs in one place.

No banking integration or partnerships — users manually input or import bills.  
Low maintenance, high usefulness, and potential for gradual expansion (CSV import, charts, mobile app).

---

## 🎯 MVP Goals (Phase 1)

**Core Features:**

| Feature | Description |
|----------|--------------|
| User Accounts | Email + password authentication (JWT-based) |
| Add Bill / Subscription | Name, amount, recurrence (monthly / yearly), due date |
| Dashboard | Overview of total monthly costs + list of upcoming payments |
| Notifications | Email reminders X days before due |
| Categories | Tag bills (Utilities, Rent, Entertainment, etc.) |
| Dark / Light Mode | Clean, minimal UI |

**Non-Goals (for now):**
- Bank API integrations  
- AI features  
- Multi-currency support  
- Mobile app (planned later)

---

## ⚙️ Tech Stack

| Layer | Choice | Notes |
|--------|---------|--------|
| **Backend** | Node.js + Express | REST API, lightweight |
| **Database** | PostgreSQL (via Knex) | Familiar SQL migration system |
| **Frontend** | Vue 3 + Vite + TailwindCSS | Fast, minimalistic UI |
| **Auth** | JWT + bcrypt | Stateless auth |
| **Mail** | Nodemailer (via Gmail or Resend) | Reminder emails |
| **Charts** | Chart.js or Recharts | For expense trends |
| **Hosting** | Render (API + DB) + Vercel (frontend) | Free tiers friendly |

---

## 🧩 Project Structure

```
gdesumipare/
 ├─ backend/
 │   ├─ src/
 │   │   ├─ controllers/      # API logic
 │   │   ├─ models/           # DB models (Knex)
 │   │   ├─ routes/           # Express routes
 │   │   ├─ db/               # Migrations & seeds
 │   │   ├─ utils/            # Helpers (auth, mail)
 │   │   └─ server.js         # App entry
 │   ├─ package.json
 │   └─ knexfile.js
 │
 ├─ frontend/
 │   ├─ src/
 │   │   ├─ components/       # Reusable UI
 │   │   ├─ pages/            # Dashboard, Auth, etc.
 │   │   ├─ composables/      # Vue 3 composables
 │   │   ├─ App.vue
 │   │   └─ main.js
 │   ├─ public/
 │   └─ vite.config.js
 │
 ├─ docker-compose.yml
 ├─ .env.example
 └─ README.md
```

---

## 🗃️ Database Schema (Initial Draft)

### Tables

#### `users`
| column | type | notes |
|--------|------|-------|
| id | serial PK |  |
| email | varchar(255) unique not null |  |
| password_hash | text not null |  |
| created_at | timestamp default now() |  |

#### `bills`
| column | type | notes |
|--------|------|-------|
| id | serial PK |  |
| user_id | int FK → users.id |  |
| name | varchar(255) | “EPS”, “Netflix” |
| category | varchar(100) | “Utilities”, “Entertainment” |
| amount_rsd | numeric(10,2) |  |
| recurrence | varchar(20) | “monthly”, “yearly” |
| due_day | int | 1–31 |
| next_due_date | date | used for reminders |
| notes | text | optional |
| created_at | timestamp default now() |  |

#### `notifications`
| column | type | notes |
|--------|------|-------|
| id | serial PK |  |
| user_id | int FK → users.id |  |
| bill_id | int FK → bills.id |  |
| sent_at | timestamp | when reminder sent |

---

## 🔌 API Overview (MVP)

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/bills` | Get all bills for user |
| POST | `/api/bills` | Add new bill |
| PUT | `/api/bills/:id` | Edit bill |
| DELETE | `/api/bills/:id` | Delete bill |
| GET | `/api/stats/monthly` | Aggregated total by category |

---

## 🎨 Frontend Pages

| Route | Description |
|--------|-------------|
| `/login` | User login |
| `/register` | Sign up |
| `/dashboard` | Monthly overview |
| `/add-bill` | Add new bill/subscription |
| `/settings` | Notification preferences / profile |

---

## 📬 Notifications System

- Cron-like scheduler checks daily for bills due within N days.  
- Sends reminder via **Nodemailer** using environment credentials.  
- Logged into `notifications` table to avoid duplicates.  

---

## 🧠 Roadmap

| Phase | Duration | Goals |
|--------|-----------|--------|
| **Phase 1 – MVP** | 3–4 weeks | Auth, Bills CRUD, Dashboard, Email reminders |
| **Phase 2 – UX & Charts** | 2 weeks | Expense visuals + categories |
| **Phase 3 – Imports** | 3 weeks | CSV import from banks |
| **Phase 4 – Mobile** | later | React Native / Capacitor client |

---

## 🧰 Setup Guide

### Requirements
- Node v18+  
- PostgreSQL  
- (optional) Docker for local setup

### Installation
```bash
git clone https://github.com/<your-username>/gdesumipare.git
cd gdesumipare

# Backend
cd backend
npm install
cp .env.example .env
npm run migrate
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```

### Environment Variables (example)
```
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/gdesumipare
JWT_SECRET=supersecret
EMAIL_SERVICE=gmail
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=app_password
```

---

## 🔒 Security Notes
- All user data stored locally (no external API).  
- Passwords → bcrypt hashes.  
- JWT tokens expire daily.  
- HTTPS enforced in production.  

---

## 📈 Future Ideas
- Smart insights (“You spent 12% more than last month”)  
- Shared accounts / household mode  
- Expense trends by category  
- Serbian language localization (default)  

---

## 👨‍💻 Maintainer
**Author:** Buba (Ljubiša Mijailović)  
Solo developer project built for Serbian market.  
Frontend design & maintenance powered by GPT-5 Codex assistant.

---

## 🪙 License
MIT License – Free to use and extend.
