import api from "./api";

export const getRecurringTransactions = (userId) =>
  api.get("/recurring-transactions", { params: { user_id: userId } });

export const getRecurringTransaction = (id) =>
  api.get(`/recurring-transactions/${id}`);

export const createRecurringTransaction = (data) =>
  api.post("/recurring-transactions", data);

export const updateRecurringTransaction = (id, data) =>
  api.put(`/recurring-transactions/${id}`, data);

export const deleteRecurringTransaction = (id) =>
  api.delete(`/recurring-transactions/${id}`);

export const pauseRecurringTransaction = (id) =>
  api.post(`/recurring-transactions/${id}/pause`);

export const resumeRecurringTransaction = (id) =>
  api.post(`/recurring-transactions/${id}/resume`);

export const runDueRecurringTransactions = (referenceDate) =>
  api.post("/recurring-transactions/run-due", { reference_date: referenceDate });
