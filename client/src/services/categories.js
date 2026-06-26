import api from "./api";

export const getCategories = (userId) => api.get("/categories", { params: { user_id: userId } });
