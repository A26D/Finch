import api from "./api";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export const getReportSummary = () => api.get("/reports/summary", { params: { user_id: USER_ID } });

export const getMonthlyReport = (params) => api.get("/reports/monthly", { params: { user_id: USER_ID, ...params } });

export const getYearlyReport = (params) => api.get("/reports/yearly", { params: { user_id: USER_ID, ...params } });

export const getCategoryReport = (params) => api.get("/reports/categories", { params: { user_id: USER_ID, ...params } });

export const getCashFlowReport = (params) => api.get("/reports/cashflow", { params: { user_id: USER_ID, ...params } });

export const getBudgetReport = () => api.get("/reports/budgets", { params: { user_id: USER_ID } });

export const getGoalReport = () => api.get("/reports/goals", { params: { user_id: USER_ID } });

export const getRecurringReport = () => api.get("/reports/recurring", { params: { user_id: USER_ID } });

export const exportReport = (format, params) =>
  api.get("/reports/export", { params: { user_id: USER_ID, ...params, format }, responseType: format === "csv" ? "blob" : "text" });
