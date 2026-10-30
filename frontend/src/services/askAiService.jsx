import api from "./api";

// Public endpoint intentionally does not attach personal account context on the server.
export const sendPublicAskAIMessage = async (message) => {
  const response = await api.post("/ask-ai/public-chat", { message });
  return response.data;
};

// The existing Axios interceptor attaches the authenticated user's JWT.
export const sendPrivateAskAIMessage = async (message, history = []) => {
  const response = await api.post("/ask-ai/chat", { message, history });
  return response.data;
};
