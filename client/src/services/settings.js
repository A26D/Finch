import api from "./api";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export function getSettings() {
  return api.get("/settings", { params: { user_id: USER_ID } });
}

export function updateSettings(data) {
  return api.put("/settings", data, { params: { user_id: USER_ID } });
}

export function resetSettings() {
  return api.post("/settings/reset", null, { params: { user_id: USER_ID } });
}
