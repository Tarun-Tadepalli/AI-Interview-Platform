import api from "./api";


export const getProgressSummary = async (
  period = "30 Days"
) => {
  const response = await api.get(
    "/progress/summary",
    {
      params: { period },
    }
  );

  return response.data;
};

export const getSpeakingProgressSummary = async (
  period = "30 Days"
) => {
  const response = await api.get(
    "/progress/speaking-summary",
    { params: { period } }
  );
  return response.data;
};

export const getInterviewProgressSummary = async (period = "30 Days") => {
  const response = await api.get("/progress/interview-summary", {
    params: { period },
  });
  return response.data;
};
