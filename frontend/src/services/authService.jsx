import api from "./api";


/* =========================================================
   REGISTER
========================================================= */

export const registerUser = async (userData) => {
  const response = await api.post(
    "/auth/register",
    userData
  );

  return response.data;
};


/* =========================================================
   LOGIN
========================================================= */

export const loginUser = async (loginData) => {
  const response = await api.post(
    "/auth/login",
    loginData
  );

  return response.data;
};


/* =========================================================
   CURRENT USER
========================================================= */

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};


/* =========================================================
   RESUME UPLOAD
========================================================= */

export const uploadResume = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/resume/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* =========================================================
   PROFILE
========================================================= */

export const getProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data;
};


export const updateProfile = async (profileData) => {
  const response = await api.put(
    "/profile/me",
    profileData
  );

  return response.data;
};


/* =========================================================
   LOGOUT
========================================================= */

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("role");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("pendingRegistration");
  localStorage.removeItem("aiInterviewResume");
};

