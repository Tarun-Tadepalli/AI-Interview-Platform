import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});


/* =========================================================
   REQUEST INTERCEPTOR

   Automatically attaches JWT token to protected requests.
========================================================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


/* =========================================================
   RESPONSE INTERCEPTOR

   If backend says the JWT is invalid/expired,
   remove authentication data and send user to login.
========================================================= */

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("role");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("pendingRegistration");
      localStorage.removeItem("aiInterviewResume");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;