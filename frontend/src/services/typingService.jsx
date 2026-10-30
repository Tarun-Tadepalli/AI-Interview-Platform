import api from "./api";


export const saveTypingResult = async (resultData) => {

  const response = await api.post(
    "/typing/result",
    resultData
  );

  return response.data;
};


export const getTypingHistory = async () => {

  const response = await api.get(
    "/typing/history"
  );

  return response.data;
};