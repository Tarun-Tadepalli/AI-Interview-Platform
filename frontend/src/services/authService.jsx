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
   REGISTRATION EMAIL OTP
========================================================= */

export const requestRegistrationOtp = async (email) => {
  const response = await api.post(
    "/auth/registration/send-otp",
    { email }
  );

  return response.data;
};


/* =========================================================
   VERIFY REGISTRATION EMAIL OTP
========================================================= */

export const verifyRegistrationOtp = async (email, otp) => {
  const response = await api.post(
    "/auth/registration/verify-otp",
    {
      email,
      otp,
    }
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
   FORGOT PASSWORD
========================================================= */

export const requestPasswordReset = async (email) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
};


/* =========================================================
   VERIFY PASSWORD RESET OTP
========================================================= */

export const verifyPasswordResetOtp = async (email, otp) => {
  const response = await api.post("/auth/verify-reset-otp", {
    email,
    otp,
  });

  return response.data;
};


/* =========================================================
   RESET PASSWORD
========================================================= */

export const resetPassword = async ({
  email,
  reset_token,
  password,
}) => {
  const response = await api.post("/auth/reset-password", {
    email,
    reset_token,
    password,
  });

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

