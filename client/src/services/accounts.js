import api from "./api";

export const getAccounts = (userId) => api.get("/accounts", { params: { user_id: userId } });
