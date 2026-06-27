import api from "./api";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export async function sendChatMessage(message) {
  const { data } = await api.post("/chat", { message }, { params: { user_id: USER_ID } });
  return data;
}
