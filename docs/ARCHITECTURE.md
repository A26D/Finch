# ExpenseTracker Architecture

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Browser   │────▶│  Vite Dev    │────▶│  Express   │
│  (React)    │◀────│  Server :5173│◀────│  :3001     │
└─────────────┘     └──────────────┘     └─────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  PostgreSQL  │
                                        │  :5432       │
                                        └─────────────┘
```

- **Client**: React SPA (Vite build), Tailwind CSS, Recharts
- **Server**: Express REST API (Node 18 compatible)
- **Database**: PostgreSQL with UUID primary keys, parameterized queries

---

## Folder Structure

```
expense-tracker/
├── client/                          # React SPA
│   └── src/
│       ├── components/
│       │   ├── budgets/             # Budget-specific components
│       │   │   ├── BudgetCard.jsx
│       │   │   ├── BudgetCategoryPicker.jsx
│       │   │   ├── BudgetForm.jsx
│       │   │   ├── BudgetList.jsx
│       │   │   ├── BudgetProgress.jsx
│       │   │   └── BudgetSummary.jsx
│       │   ├── charts/              # Recharts wrappers
│       │   │   ├── ChartCard.jsx
│       │   │   ├── EmptyChart.jsx
│       │   │   ├── ExpensePieChart.jsx
│       │   │   ├── IncomeExpenseLineChart.jsx
│       │   │   └── MonthlyBarChart.jsx
│       │   ├── DashboardCard.jsx
│       │   ├── DateRangePicker.jsx
│       │   ├── FilterPanel.jsx
│       │   ├── ActiveFilters.jsx
│       │   ├── Navbar.jsx
│       │   ├── SearchBar.jsx
│       │   ├── SortDropdown.jsx
│       │   ├── SummaryCards.jsx
│       │   ├── TransactionForm.jsx
│       │   ├── TransactionItem.jsx
│       │   └── TransactionList.jsx
│       ├── hooks/
│       │   ├── useAnalytics.js      # Memoized analytics
│       │   ├── useBudgets.js        # Budgets CRUD + data
│       │   ├── useDashboardData.js  # Dashboard data fetch
│       │   └── useTransactionFilters.js
│       ├── pages/
│       │   ├── Budgets.jsx
│       │   ├── Dashboard.jsx
│       │   └── Transactions.jsx
│       ├── services/
│       │   ├── accounts.js
│       │   ├── api.js               # Axios instance
│       │   ├── budgets.js
│       │   ├── categories.js
│       │   └── transactions.js
│       ├── utils/
│       │   ├── analytics.js         # 12 pure analytics fns
│       │   ├── budgetAnalytics.js   # 6 budget calculation fns
│       │   ├── chartData.js         # Chart data transformations
│       │   └── filterTransactions.js# Search/filter/sort
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── src/
│   │   ├── migrations/
│   │   │   ├── 001_create_tables.sql
│   │   │   └── 002_create_budgets.sql
│   │   ├── middleware/
│   │   │   └── validate.js
│   │   ├── routes/
│   │   │   ├── accounts.js
│   │   │   ├── budgets.js
│   │   │   ├── categories.js
│   │   │   └── transactions.js
│   │   ├── services/
│   │   │   └── budgetService.js
│   │   ├── app.js                # Express app (exported for tests)
│   │   ├── db.js
│   │   └── index.js              # Server entry (imports app.js)
│   ├── tests/
│   │   ├── budgetService.test.js
│   │   └── integration/
│   │       └── budgets.test.js
│   └── vitest.config.js
├── client/
│   └── src/
│       ├── utils/
│       │   └── __tests__/
│       │       ├── analytics.test.js
│       │       ├── budgetAnalytics.test.js
│       │       └── filterTransactions.test.js
│       └── ...
├── docs/
│   └── ARCHITECTURE.md
├── CHANGELOG.md
└── package.json
```

---

## Design Principles

1. **Separation of concerns**: Components render UI only. Business logic lives in pure util functions and hooks.
2. **Memoization**: All derived data uses `useMemo` to avoid unnecessary recalculations.
3. **Parameterized queries**: All SQL uses `$1, $2` placeholders — no string interpolation.
4. **Soft deletes**: Budgets use `archived_at` instead of hard deletion.
5. **Hardcoded user**: `860e5c75-ad13-454d-899d-f140a3767fb6` — auth will replace this later.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | DB connectivity check |
| GET | `/api/transactions` | List/filter transactions |
| GET | `/api/transactions/:id` | Get single transaction |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/accounts` | List accounts |
| GET | `/api/categories` | List categories |
| GET | `/api/budgets` | List budgets (enriched with spent/remaining) |
| GET | `/api/budgets/:id` | Get single budget |
| POST | `/api/budgets` | Create budget with categories |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Soft-delete (archive) budget |

---

## Database Schema

- **users**: id, name, email, created_at
- **accounts**: id, user_id, name, type, balance
- **categories**: id, user_id, name, type, icon, color
- **transactions**: id, user_id, account_id, category_id, type, amount, description, date
- **budgets**: id, user_id, name, type, amount, period, start_date, end_date, rollover_enabled, strictness, alert_threshold, goal_id, archived_at
- **budget_categories**: budget_id, category_id (join table)
- **goals**: id, user_id, name, target_amount, current_amount, deadline
- **recurring_bills**: id, user_id, name, amount, frequency, next_date
- **receipts**: id, transaction_id, image_url, ocr_data
- **insights**: id, user_id, type, title, description, generated_at

---

## Extension Points for AI Features

### Forecasting
- **Where**: New file `server/src/services/forecastService.js` + route `routes/forecast.js`
- **Client**: New hook `useForecast.js` + chart component
- **Data source**: Historical `transactions` table grouped by category-month
- **Model**: Simple moving average or linear regression (no external API needed for v1)

### Goal Planning
- **Where**: `goals` table already exists in migration 001
- **Integration**: link `goals.id` to `budgets.goal_id` — a goal can have multiple budgets contributing toward it
- **Client**: GoalCard, GoalForm, GoalProgress components (pattern follows budgets module)

### Notifications
- **Where**: New `server/src/services/notificationService.js`
- **Triggers**: Budget exceeding `alert_threshold`, goal approaching deadline, recurring bill due
- **Delivery**: In-app banner (state managed via React context) + optional email later
- **Client**: `NotificationBanner.jsx` component, `useNotifications.js` hook

### AI Insights
- **Where**: BudgetSummary has an `AI_INSIGHT_SLOT` comment awaiting AI-generated text
- **Approach**: Fetch last N months of transactions, compute per-category averages, compare to current period, generate plain-English sentence
- **Hooks**: Reuse `useAnalytics.js` and `utils/analytics.js` for the math

---

## Running Locally

```bash
# Server
cd server
cp .env.example .env   # configure DB credentials
node src/index.js

# Client (separate terminal)
cd client
npm run dev
```

---

## Testing Strategy

### Framework

| Layer | Tool | Environment |
|-------|------|-------------|
| Client (JS/React) | Vitest + React Testing Library | jsdom |
| Server (Node/Express) | Vitest + Supertest | node |

Vitest is chosen for both layers to keep a consistent API (`describe`/`it`/`expect`/`vi`) across the project.

### Test Structure

```
server/
  tests/
    budgetService.test.js        # Unit tests for service layer
    integration/
      budgets.test.js            # Integration tests for budgets API
client/
  src/
    utils/
      __tests__/
        analytics.test.js        # Unit tests for analytics utils
        budgetAnalytics.test.js  # Unit tests for budget analytics utils
        filterTransactions.test.js # Unit tests for filter/sort utils
```

### Running Tests

```bash
# Run all tests
npm test

# Run client tests only
npm run test:client

# Run server tests only
npm run test:server

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### What Each Layer Covers

**Client — Pure utility tests (Vitest + jsdom)**
- `analytics.js`: 12 pure functions for financial calculations (income, expenses, trends, etc.)
- `budgetAnalytics.js`: 6 pure functions for budget calculations (progress, overspend, status, etc.)
- `filterTransactions.js`: Pure filter/sort function with composable predicates
- Future: React component tests with RTL (hooks with `renderHook`, components with `screen`)

**Server — Service layer tests (Vitest + Supertest)**
- `budgetService.js`: Pure functions (period window, amount calculation) tested directly; pool-dependent functions tested with `vi.fn()` mock pool
- Zod schema validation tested inline (create and update schemas)
- Integration: Budgets CRUD via Supertest against the real Express app and database (no DB mocking for integration tests)

### Naming Conventions

- Pure function files: `[name].test.js` or `__tests__/[name].test.js`
- Service layer: `tests/[serviceName].test.js`
- Integration: `tests/integration/[feature].test.js`
- React components: co-located `[Component].test.jsx`

### Mocking Strategy

- **Pool (pg)**: `vi.fn()` on `pool.query` returning `{ rows: [...] }` — no real DB connection needed for unit tests
- **Date**: Fixed dates passed explicitly to pure functions (no global date mocks)
- **Network**: Supertest handles HTTP without a running server (imports Express app directly)
- **Future React components**: `vi.mock()` for services/hooks at module level
