import api from "./api";


// ============================================================
// GET LOGGED-IN USER PROFILE
// ============================================================

export const getProfile = async () => {
  const response = await api.get("/profile/me");

  return response.data.profile;
};


// ============================================================
// UPDATE LOGGED-IN USER PROFILE
// ============================================================

export const updateProfile = async (profile) => {

  const data = {
    first_name: profile.firstName,
    last_name: profile.lastName,
    phone: profile.phone,

    status: profile.status,
    college: profile.college,
    degree: profile.degree,
    graduation_year: Number(profile.graduationYear),

    target_role: profile.targetRole,
    experience: profile.experience,
    interview_focus: profile.interviewFocus,
    programming_language: profile.programmingLanguage
  };

  const response = await api.put(
    "/profile/me",
    data
  );

  return response.data.profile;
};