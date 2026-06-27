import api from "./api";

export const getGoals = (userId) => api.get("/goals", { params: { user_id: userId } });

export const getGoal = (id) => api.get(`/goals/${id}`);

export const createGoal = (data) => api.post("/goals", data);

export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);

export const deleteGoal = (id) => api.delete(`/goals/${id}`);

export const contributeToGoal = (id, amount) => api.post(`/goals/${id}/contribute`, { amount });
