import api from "./api";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export function getNotifications(params = {}) {
  return api.get("/notifications", { params: { user_id: USER_ID, ...params } });
}

export function getUnreadCount() {
  return api.get("/notifications/unread-count", { params: { user_id: USER_ID } });
}

export function markAsRead(id) {
  return api.post(`/notifications/${id}/read`, null, { params: { user_id: USER_ID } });
}

export function markAllAsRead() {
  return api.post("/notifications/read-all", null, { params: { user_id: USER_ID } });
}

export function archiveNotification(id) {
  return api.delete(`/notifications/${id}`, { params: { user_id: USER_ID } });
}
