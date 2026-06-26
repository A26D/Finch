# Changelog

## Version 0.5
- Added multi-category budgets with soft deletes
- Added budget analytics and progress tracking
- Added budget CRUD (backend service layer, routes, frontend components)
- Added BudgetSummary component to Dashboard
- Added Budgets page with route and nav integration
- Added architecture documentation

## Version 0.4
- Added analytics engine (12 pure utility functions)
- Added reusable `useAnalytics` memoized hook
- Added 8 dashboard metric cards (avg daily/monthly spend, largest expense/income, savings rate, net cash flow, spending/income trends)
- Added subtitle prop to DashboardCard

## Version 0.3
- Added search and filter module
- Added `useTransactionFilters` hook with memoized state
- Added SearchBar, FilterPanel, SortDropdown, DateRangePicker, ActiveFilters components
- Added pure filter/sort utility function

## Version 0.2
- Added Recharts-based charts (Pie, Bar, Line)
- Added ChartCard and EmptyChart components
- Added chart data utilities (groupByCategory, groupByMonth, incomeVsExpense)
- Added `useDashboardData` hook for fetching and memoizing dashboard data

## Version 0.1
- Initial project setup (npm workspaces, Vite 5, React, Tailwind, Express, PostgreSQL)
- Database schema (9 tables with indexes)
- Transactions CRUD API with Zod validation and parameterized queries
- Accounts and Categories API endpoints
- Frontend components (Navbar, DashboardCard, SummaryCards, TransactionForm, TransactionList, TransactionItem)
- Dashboard and Transactions pages with React Router v6
- Axios services for API communication
