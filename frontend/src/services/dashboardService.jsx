const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function readToken() {
  // Check the common names used by the project's existing auth implementations.
  // The API itself still validates the token; no user ID is sent by the client.
  const keys = ["access_token", "accessToken", "token", "authToken", "jwt"];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && value !== "undefined" && value !== "null") return value;
  }
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    return user?.access_token || user?.accessToken || user?.token || null;
  } catch {
    return null;
  }
}

export async function getDashboardSummary() {
  const token = readToken();
  if (!token) {
    throw new Error("Your login session was not found. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Your login session has expired. Please log in again.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The dashboard server returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Could not load dashboard data.");
  }

  return data;
}
