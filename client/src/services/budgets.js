import api from "./api";

export const getBudgets = (userId) => api.get("/budgets", { params: { user_id: userId } });

export const getBudget = (id) => api.get(`/budgets/${id}`);

export const createBudget = (data) => api.post("/budgets", data);

export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);

export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
