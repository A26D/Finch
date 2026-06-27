import api from "./api";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export function getInsights() {
  return api.get("/ai/insights", { params: { user_id: USER_ID } });
}

export function getDashboardSummary() {
  return api.get("/ai/dashboard", { params: { user_id: USER_ID } });
}
