# 💰 FINCH- AI Expense Tracker

A production-grade personal finance management platform with AI-powered insights, built on a modern, scalable architecture: **React**, **Node.js/Express**, **PostgreSQL**, **Redis**, and **BullMQ**.

Beyond standard expense tracking, this project implements a write-triggered, cache-backed dashboard architecture, a tool-calling AI assistant grounded in real financial data, and a background job pipeline for notifications and analytics — patterns commonly found in production fintech systems rather than typical CRUD tutorials.

> 🚀 **Flutter mobile app in development.**

---

## Why this project

Most expense tracker tutorials stop at CRUD. This one is built the way a real product would be:

- **Compute-on-write, not compute-on-read** — the dashboard never runs live aggregation queries; everything is precomputed by background workers and served from cache, so it's instant on every open.
- **AI grounded in real data, not hallucination** — the AI Assistant uses tool-calling to query actual user data through existing services; it never invents numbers.
- **Designed for extension, not just function** — the schema and service layers were built with future features (rollover budgets, goal-linked recommendations, fraud detection) as first-class extension points, not afterthoughts.

---

## ✨ Features

### 📊 Dashboard
Real-time financial overview, income vs. expense summary, savings rate, category-wise analytics, and an AI-generated insight card — served from a single cached endpoint for instant load.

### 💸 Transactions
Full CRUD with categorization, search, sort, and filtering. Soft deletes throughout — no data is ever permanently lost on user action.

### 🎯 Savings Goals
Goal creation and tracking with contributions, progress calculations, and completion notifications. Goals link directly to budgets, enabling future AI-driven reallocation recommendations.

### 💰 Budgets
Flexible budgeting (not just flat monthly caps) with utilization tracking, configurable alert thresholds, and per-budget analytics — architected to support rule-based and rollover budgets in future iterations.

### 🔁 Recurring Transactions
Scheduled income/expenses with pause/resume controls and automatic dashboard sync.

### 📈 Reports
Monthly reports with category breakdowns, CSV export, and PDF export.

### 🔔 Notifications
Event-driven, deduplicated alerts for budget thresholds, goal completion, and unusual spending — generated entirely by background workers, never during a page read.

### 🤖 AI Assistant
A tool-calling AI assistant that answers natural-language questions about your finances by querying real backend services — not by generating numbers from a language model. Includes a local fallback mode that works without an Anthropic API key.

### ⚡ Performance & Architecture
Redis caching, BullMQ background workers, write-triggered cache invalidation, and a dedicated notification queue — see [Architecture](#-architecture) below.

### 🔐 Authentication
JWT authentication with refresh token rotation and HttpOnly cookies. All API routes are protected and scoped per-user at the service layer.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Axios, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Cache | Redis |
| Job Queue | BullMQ |
| AI | Anthropic API (Claude), tool-calling |
| Validation | Zod |
| Testing | Vitest, Supertest |
| Mobile *(in progress)* | Flutter |

---

## 📂 Project Structure

```text
ExpenseTracker/
│
├── client/          # React frontend
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/      # HTTP layer — no business logic
│   │   ├── services/    # Business logic, DB access
│   │   ├── jobs/         # BullMQ queues & workers
│   │   └── db/           # Migrations & models
├── docs/            # Architecture documentation
├── docker-compose.yml
└── README.md
```

---

## 📈 Architecture

The system is built around one core principle: **the dashboard is never computed live.** Every write triggers a background recomputation; every read is a cache hit.

```
┌──────────────┐
│   React UI    │
└──────┬───────┘
       │ REST (single dashboard call on load)
       ▼
┌──────────────┐        ┌────────────────────┐
│  Express API  │──────▶│  Redis (cache)       │◀──── instant reads
└──────┬───────┘        └────────────────────┘
       │ writes                     ▲
       ▼                            │ recompute & write
┌──────────────┐        ┌────────────────────┐
│  PostgreSQL   │        │  BullMQ Workers       │
│ (source of    │───────▶│  • Dashboard recompute │
│  truth)       │        │  • Notification jobs   │
└──────────────┘        └────────────────────┘
```

**Write path:** a transaction/budget/goal change → write committed to PostgreSQL → a recompute job is enqueued → the worker recalculates the dashboard payload and updates Redis → the next read is instant, never recalculated on the fly.

**AI Assistant path:** user question → Claude decides which existing service function(s) answer it (tool-calling) → the backend executes that function against real data → Claude responds using only the returned values.

Full design rationale is documented in [`docs/`](./docs).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis

### Clone the repository
```bash
git clone https://github.com/A26D/ExpenseTracker.git
cd ExpenseTracker
```

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in DB, Redis, and Anthropic API credentials
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Running Tests

```bash
# Backend
cd server
npm test

# Frontend
cd client
npm test
```

300+ tests covering services, API routes, queue workers, and analytics utilities.

---




## 👩‍💻 Author

**Aditi**
GitHub: [@A26D](https://github.com/A26D)

---

## 📄 License

Licensed under the [MIT License](./LICENSE).
