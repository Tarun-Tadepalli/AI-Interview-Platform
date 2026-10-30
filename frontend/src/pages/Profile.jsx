import React, {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import { useNavigate } from "react-router-dom";
  
  import {
    ArrowLeft,
    Camera,
    Check,
    ChevronDown,
    Edit3,
    ExternalLink,
    FileText,
    GraduationCap,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    Sparkles,
    Target,
    Trash2,
    Upload,
    UserRound,
    X,
    BriefcaseBusiness,
    Code2,
  } from "lucide-react";
  
  import Navbar1 from "../components/Navbar1";
  
  import api from "../services/api";
  
  import "../styles/profile.css";
  
  
  /* =========================================================
     LOCAL STORAGE KEYS
  ========================================================= */
  
  const STORAGE_KEY = "aiInterviewRegistration";
  const LEGACY_STORAGE_KEY = "pendingRegistration";
  const PHOTO_KEY = "aiInterviewProfilePhoto";
  
  
  /* =========================================================
     EMPTY PROFILE
  ========================================================= */
  
  const emptyProfile = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "",
    college: "",
    degree: "",
    graduationYear: "",
    targetRole: "",
    experience: "",
    interviewFocus: "",
    programmingLanguage: "",
    terms: false,
  };
  
  
  /* =========================================================
     PROFILE OPTIONS
  ========================================================= */
  
  const statusOptions = [
    ["student", "Student"],
    ["graduate", "Graduate"],
    ["working-professional", "Working Professional"],
    ["career-switcher", "Career Switcher"],
    ["other", "Other"],
  ];
  
  const roleOptions = [
    ["software-developer", "Software Developer"],
    ["frontend-developer", "Frontend Developer"],
    ["backend-developer", "Backend Developer"],
    ["fullstack-developer", "Full Stack Developer"],
    ["data-scientist", "Data Scientist"],
    ["data-analyst", "Data Analyst"],
    ["ai-ml-engineer", "AI / ML Engineer"],
    ["cloud-engineer", "Cloud Engineer"],
    ["devops-engineer", "DevOps Engineer"],
    ["cybersecurity-engineer", "Cybersecurity Engineer"],
    ["other", "Other"],
  ];
  
  const experienceOptions = [
    ["fresher", "Fresher"],
    ["0-1", "0–1 years"],
    ["1-3", "1–3 years"],
    ["3-5", "3–5 years"],
    ["5+", "5+ years"],
  ];
  
  const focusOptions = [
    ["technical", "Technical"],
    ["behavioral", "HR / Behavioral"],
    ["coding", "Coding"],
    ["ai-ml", "AI / ML"],
    ["system-design", "System Design"],
    ["mixed", "Mixed"],
  ];
  
  const languageOptions = [
    ["python", "Python"],
    ["java", "Java"],
    ["javascript", "JavaScript"],
    ["typescript", "TypeScript"],
    ["cpp", "C++"],
    ["c", "C"],
    ["csharp", "C#"],
    ["go", "Go"],
    ["other", "Other"],
  ];
  
  const graduationYears = Array.from(
    { length: 12 },
    (_, index) => 2025 + index
  );
  
  
  /* =========================================================
     LOCAL STORAGE HELPERS
  ========================================================= */
  
  function readJson(key) {
    try {
      const value = localStorage.getItem(key);
  
      return value
        ? JSON.parse(value)
        : null;
    } catch {
      return null;
    }
  }
  
  
  /* =========================================================
     INITIAL PROFILE
  ========================================================= */
  
  function getInitialProfile() {
  
    const currentUser = readJson(
      "currentUser"
    );
  
    const registration = readJson(
      STORAGE_KEY
    );
  
    const legacy = readJson(
      LEGACY_STORAGE_KEY
    );
  
    return {
      ...emptyProfile,
      ...(currentUser || {}),
      ...(registration || {}),
      ...(legacy || {}),
    };
  }
  
  
  /* =========================================================
     BACKEND PROFILE -> FRONTEND PROFILE
  ========================================================= */
  
  function convertBackendProfile(data) {
  
    if (!data) {
      return emptyProfile;
    }
  
    return {
      firstName:
        data.first_name ??
        data.firstName ??
        "",
  
      lastName:
        data.last_name ??
        data.lastName ??
        "",
  
      email:
        data.email ??
        "",
  
      phone:
        data.phone ??
        "",
  
      status:
        data.status ??
        "",
  
      college:
        data.college ??
        "",
  
      degree:
        data.degree ??
        "",
  
      graduationYear:
        data.graduation_year ??
        data.graduationYear ??
        "",
  
      targetRole:
        data.target_role ??
        data.targetRole ??
        "",
  
      experience:
        data.experience ??
        "",
  
      interviewFocus:
        data.interview_focus ??
        data.interviewFocus ??
        "",
  
      programmingLanguage:
        data.programming_language ??
        data.programmingLanguage ??
        "",
  
      terms:
        data.terms_accepted ??
        data.terms ??
        false,
    };
  }
  
  
  /* =========================================================
     FRONTEND PROFILE -> BACKEND PROFILE
  ========================================================= */
  
  function convertFrontendProfile(data) {
  
    return {
  
      first_name:
        data.firstName?.trim() || "",
  
      last_name:
        data.lastName?.trim() || "",
  
      phone:
        data.phone?.trim() || "",
  
      status:
        data.status || "",
  
      college:
        data.college?.trim() || "",
  
      degree:
        data.degree?.trim() || "",
  
      graduation_year:
        data.graduationYear
          ? Number(data.graduationYear)
          : null,
  
      target_role:
        data.targetRole || "",
  
      experience:
        data.experience || "",
  
      interview_focus:
        data.interviewFocus || "",
  
      programming_language:
        data.programmingLanguage || "",
    };
  }
  
  
  /* =========================================================
     LABEL HELPER
  ========================================================= */
  
  function getLabel(options, value) {
  
    return (
      options.find(
        ([optionValue]) =>
          optionValue === value
      )?.[1] ||
      value ||
      "Not provided"
    );
  }
  
  
  /* =========================================================
     PROFILE COMPONENT
  ========================================================= */
  
  export default function Profile() {
  
    const navigate = useNavigate();
  
  
    /* =======================================================
       PROFILE STATE
    ======================================================= */
  
    const [profile, setProfile] =
      useState(getInitialProfile);
  
    const [editingSection, setEditingSection] =
      useState(null);
  
    const [draft, setDraft] =
      useState(getInitialProfile);
  
  
    /* =======================================================
       PHOTO STATE
    ======================================================= */
  
    const [photo, setPhoto] =
      useState(() =>
        localStorage.getItem(PHOTO_KEY) || ""
      );
  
  
    /* =======================================================
       RESUME STATE
    ======================================================= */
  
    const [resume, setResume] =
      useState(null);
  
    const [resumeUrl, setResumeUrl] =
      useState("");
  
    const [resumeLoading, setResumeLoading] =
      useState(true);
  
    const [resumeActionLoading, setResumeActionLoading] =
      useState(false);
  
  
    /* =======================================================
       GENERAL STATE
    ======================================================= */
  
    const [message, setMessage] =
      useState("");
  
    const [error, setError] =
      useState("");
  
  
    /* =======================================================
       LOAD PROFILE FROM BACKEND
    ======================================================= */
  
    useEffect(() => {
  
      let mounted = true;
  
      const loadProfile = async () => {
  
        try {
  
          const response =
            await api.get("/profile/me");
  
          if (!mounted) {
            return;
          }
  
          if (
            response.data?.success &&
            response.data?.profile
          ) {
  
            const backendProfile =
              convertBackendProfile(
                response.data.profile
              );
  
            setProfile(
              backendProfile
            );
  
            setDraft(
              backendProfile
            );
  
            localStorage.setItem(
              "currentUser",
              JSON.stringify(
                backendProfile
              )
            );
          }
  
        } catch (requestError) {
  
          console.error(
            "Failed to load profile:",
            requestError
          );
  
          if (
            requestError.response?.status !== 401
          ) {
  
            setError(
              "Unable to load your profile."
            );
          }
  
        }
  
      };
  
      loadProfile();
  
      return () => {
        mounted = false;
      };
  
    }, []);
  
  
    /* =======================================================
       LOAD RESUME METADATA
    ======================================================= */
  
    useEffect(() => {
  
      let mounted = true;
  
      const loadResume = async () => {
  
        setResumeLoading(true);
  
        try {
  
          const response =
            await api.get("/resume/me");
  
          if (!mounted) {
            return;
          }
  
          if (
            response.data?.success
          ) {
  
            setResume(
              response.data.resume || null
            );
  
          }
  
        } catch (requestError) {
  
          console.error(
            "Failed to load resume:",
            requestError
          );
  
          if (
            requestError.response?.status !== 401
          ) {
  
            setError(
              "Unable to load your resume."
            );
          }
  
        } finally {
  
          if (mounted) {
            setResumeLoading(false);
          }
  
        }
  
      };
  
      loadResume();
  
      return () => {
        mounted = false;
      };
  
    }, []);
  
  
    /* =======================================================
       CLEANUP RESUME OBJECT URL
    ======================================================= */
  
    useEffect(() => {
  
      return () => {
  
        if (resumeUrl) {
          URL.revokeObjectURL(
            resumeUrl
          );
        }
  
      };
  
    }, [resumeUrl]);
  
  
    /* =======================================================
       FULL NAME
    ======================================================= */
  
    const fullName = useMemo(() => {
  
      const name =
        `${profile.firstName} ${profile.lastName}`
          .trim();
  
      return name || "Your Name";
  
    }, [
      profile.firstName,
      profile.lastName,
    ]);
  
  
    /* =======================================================
       INITIALS
    ======================================================= */
  
    const initials = useMemo(() => {
  
      const first =
        profile.firstName?.charAt(0) ||
        "U";
  
      const last =
        profile.lastName?.charAt(0) ||
        "";
  
      return `${first}${last}`.toUpperCase();
  
    }, [
      profile.firstName,
      profile.lastName,
    ]);
  
  
    /* =======================================================
       START EDIT
    ======================================================= */
  
    const beginEdit = (section) => {
  
      setDraft({
        ...profile,
      });
  
      setEditingSection(
        section
      );
  
      setMessage("");
      setError("");
    };
  
  
    /* =======================================================
       CANCEL EDIT
    ======================================================= */
  
    const cancelEdit = () => {
  
      setDraft({
        ...profile,
      });
  
      setEditingSection(null);
  
      setError("");
    };
  
  
    /* =======================================================
       UPDATE DRAFT
    ======================================================= */
  
    const updateDraft = (event) => {
  
      const {
        name,
        value,
      } = event.target;
  
      setDraft(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };
  
  
    /* =======================================================
       SAVE PROFILE SECTION
    ======================================================= */
  
    const saveSection = async (
      section
    ) => {
  
      setMessage("");
      setError("");
  
  
      /* -------------------------------------------------------
         VALIDATION
      ------------------------------------------------------- */
  
      if (
        section === "personal"
      ) {
  
        if (
          !draft.firstName.trim()
        ) {
  
          setError(
            "First name is required."
          );
  
          return;
        }
  
        if (
          !draft.lastName.trim()
        ) {
  
          setError(
            "Last name is required."
          );
  
          return;
        }
  
        if (
          !draft.phone.trim()
        ) {
  
          setError(
            "Phone number is required."
          );
  
          return;
        }
      }
  
  
      if (
        section === "education"
      ) {
  
        if (!draft.status) {
  
          setError(
            "Please select your current status."
          );
  
          return;
        }
  
        if (
          !draft.college.trim()
        ) {
  
          setError(
            "College / University is required."
          );
  
          return;
        }
  
        if (
          !draft.degree.trim()
        ) {
  
          setError(
            "Degree / Program is required."
          );
  
          return;
        }
  
        if (
          !draft.graduationYear
        ) {
  
          setError(
            "Graduation year is required."
          );
  
          return;
        }
      }
  
  
      if (
        section === "interview"
      ) {
  
        if (!draft.targetRole) {
  
          setError(
            "Please select your target role."
          );
  
          return;
        }
  
        if (!draft.experience) {
  
          setError(
            "Please select your experience level."
          );
  
          return;
        }
  
        if (!draft.interviewFocus) {
  
          setError(
            "Please select your interview focus."
          );
  
          return;
        }
  
        if (
          !draft.programmingLanguage
        ) {
  
          setError(
            "Please select your preferred programming language."
          );
  
          return;
        }
      }
  
  
      /* -------------------------------------------------------
         SAVE TO BACKEND
      ------------------------------------------------------- */
  
      try {
  
        const backendData =
          convertFrontendProfile(
            draft
          );
  
        const response =
          await api.put(
            "/profile/me",
            backendData
          );
  
  
        if (
          response.data?.success &&
          response.data?.profile
        ) {
  
          const updatedProfile =
            convertBackendProfile(
              response.data.profile
            );
  
          setProfile(
            updatedProfile
          );
  
          setDraft(
            updatedProfile
          );
  
          localStorage.setItem(
            "currentUser",
            JSON.stringify(
              updatedProfile
            )
          );
  
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
              updatedProfile
            )
          );
  
          localStorage.setItem(
            LEGACY_STORAGE_KEY,
            JSON.stringify(
              updatedProfile
            )
          );
  
          setEditingSection(null);
  
          setMessage(
            "Profile updated successfully."
          );
  
          setError("");
  
        } else {
  
          throw new Error(
            "Profile update failed."
          );
        }
  
      } catch (requestError) {
  
        console.error(
          "Profile update error:",
          requestError
        );
  
        if (
          requestError.response?.status === 401
        ) {
          return;
        }
  
        setError(
          requestError.response?.data?.detail ||
          "Unable to update profile."
        );
      }
  
    };
  
  
    /* =======================================================
       PROFILE PHOTO
    ======================================================= */
  
    const handlePhotoChange = (
      event
    ) => {
  
      const file =
        event.target.files?.[0];
  
      if (!file) {
        return;
      }
  
      setMessage("");
      setError("");
  
  
      if (
        !file.type.startsWith("image/")
      ) {
  
        setError(
          "Please choose an image file."
        );
  
        return;
      }
  
  
      if (
        file.size > 3 * 1024 * 1024
      ) {
  
        setError(
          "Profile photo must be smaller than 3 MB."
        );
  
        return;
      }
  
  
      const reader =
        new FileReader();
  
  
      reader.onload = () => {
  
        const imageData =
          reader.result;
  
        localStorage.setItem(
          PHOTO_KEY,
          imageData
        );
  
        setPhoto(
          imageData
        );
  
        setMessage(
          "Profile photo updated."
        );
      };
  
  
      reader.onerror = () => {
  
        setError(
          "Unable to read the selected photo."
        );
      };
  
  
      reader.readAsDataURL(file);
    };
  
  
    /* =======================================================
       REMOVE PHOTO
    ======================================================= */
  
    const removePhoto = () => {
  
      localStorage.removeItem(
        PHOTO_KEY
      );
  
      setPhoto("");
  
      setMessage(
        "Profile photo removed."
      );
    };
  
  
    /* =======================================================
       UPLOAD / REPLACE RESUME
    ======================================================= */
  
    const handleResumeChange = async (
      event
    ) => {
  
      const file =
        event.target.files?.[0];
  
      if (!file) {
        return;
      }
  
      setMessage("");
      setError("");
  
  
      /* -------------------------------------------------------
         PDF VALIDATION
      ------------------------------------------------------- */
  
      const isPdf =
        file.type === "application/pdf" ||
        file.name
          .toLowerCase()
          .endsWith(".pdf");
  
  
      if (!isPdf) {
  
        setError(
          "Please upload your resume in PDF format."
        );
  
        event.target.value = "";
  
        return;
      }
  
  
      if (
        file.size > 5 * 1024 * 1024
      ) {
  
        setError(
          "Resume must be smaller than 5 MB."
        );
  
        event.target.value = "";
  
        return;
      }
  
  
      /* -------------------------------------------------------
         UPLOAD TO BACKEND
      ------------------------------------------------------- */
  
      try {
  
        setResumeActionLoading(
          true
        );
  
  
        const formData =
          new FormData();
  
        formData.append(
          "file",
          file
        );
  
  
        const response =
          await api.post(
            "/resume/upload",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );
  
  
        if (
          response.data?.success
        ) {
  
          /*
           * Fetch fresh metadata from
           * backend after upload.
           */
  
          const resumeResponse =
            await api.get(
              "/resume/me"
            );
  
  
          setResume(
            resumeResponse.data?.resume ||
            null
          );
  
  
          /*
           * Old preview URL is no
           * longer needed.
           */
  
          if (resumeUrl) {
  
            URL.revokeObjectURL(
              resumeUrl
            );
  
            setResumeUrl("");
          }
  
  
          setMessage(
            "Resume uploaded successfully."
          );
  
        } else {
  
          throw new Error(
            "Resume upload failed."
          );
        }
  
      } catch (requestError) {
  
        console.error(
          "Resume upload error:",
          requestError
        );
  
        if (
          requestError.response?.status !== 401
        ) {
  
          setError(
            requestError.response?.data?.detail ||
            "Unable to upload resume."
          );
        }
  
      } finally {
  
        setResumeActionLoading(
          false
        );
  
        event.target.value = "";
      }
  
    };
  
  
    /* =======================================================
       VIEW RESUME
    ======================================================= */
  
    const handleViewResume = async () => {
  
      setMessage("");
      setError("");
  
      try {
  
        setResumeActionLoading(
          true
        );
  
  
        const response =
          await api.get(
            "/resume/view",
            {
              responseType: "blob",
            }
          );
  
  
        const blob =
          new Blob(
            [response.data],
            {
              type:
                response.headers[
                  "content-type"
                ] ||
                "application/pdf",
            }
          );
  
  
        const objectUrl =
          URL.createObjectURL(
            blob
          );
  
  
        if (resumeUrl) {
  
          URL.revokeObjectURL(
            resumeUrl
          );
        }
  
  
        setResumeUrl(
          objectUrl
        );
  
  
        /*
         * Open PDF in new tab.
         */
  
        window.open(
          objectUrl,
          "_blank",
          "noopener,noreferrer"
        );
  
      } catch (requestError) {
  
        console.error(
          "Resume view error:",
          requestError
        );
  
        if (
          requestError.response?.status !== 401
        ) {
  
          setError(
            "Unable to open your resume."
          );
        }
  
      } finally {
  
        setResumeActionLoading(
          false
        );
      }
  
    };
  
  
    /* =======================================================
       DELETE RESUME
    ======================================================= */
  
    const removeResume = async () => {
  
      const confirmed =
        window.confirm(
          "Are you sure you want to delete your resume?"
        );
  
  
      if (!confirmed) {
        return;
      }
  
  
      setMessage("");
      setError("");
  
  
      try {
  
        setResumeActionLoading(
          true
        );
  
  
        await api.delete(
          "/resume/me"
        );
  
  
        if (resumeUrl) {
  
          URL.revokeObjectURL(
            resumeUrl
          );
  
          setResumeUrl("");
        }
  
  
        setResume(null);
  
  
        setMessage(
          "Resume deleted successfully."
        );
  
      } catch (requestError) {
  
        console.error(
          "Resume delete error:",
          requestError
        );
  
        if (
          requestError.response?.status !== 401
        ) {
  
          setError(
            requestError.response?.data?.detail ||
            "Unable to delete your resume."
          );
        }
  
      } finally {
  
        setResumeActionLoading(
          false
        );
      }
  
    };
  
  
    /* =======================================================
       FORMAT FILE SIZE
    ======================================================= */
  
    const formatFileSize = (
      bytes = 0
    ) => {
  
      if (!bytes) {
        return "PDF document";
      }
  
      return `${(
        bytes / 1024 / 1024
      ).toFixed(2)} MB`;
    };
  
  
    /* =======================================================
       EDITOR
    ======================================================= */
  
    const renderEditor = (
      section
    ) => {
  
      if (
        editingSection !== section
      ) {
        return null;
      }
  
  
      if (
        section === "personal"
      ) {
  
        return (
  
          <div className="profile-edit-form">
  
            <div className="profile-form-grid">
  
              <Field
                label="First name"
                name="firstName"
                value={draft.firstName}
                onChange={updateDraft}
              />
  
              <Field
                label="Last name"
                name="lastName"
                value={draft.lastName}
                onChange={updateDraft}
              />
  
              <Field
                label="Phone number"
                name="phone"
                value={draft.phone}
                onChange={updateDraft}
                type="tel"
              />
  
              <div className="profile-field">
  
                <label>
                  Email address
                </label>
  
                <div className="profile-readonly-input">
  
                  <Mail size={16} />
  
                  <span>
                    {profile.email ||
                      "Not provided"}
                  </span>
  
                  <LockKeyhole
                    size={14}
                  />
  
                </div>
  
                <small>
                  Email is kept read-only
                  because it is your account
                  identifier.
                </small>
  
              </div>
  
            </div>
  
          </div>
  
        );
      }
  
  
      if (
        section === "education"
      ) {
  
        return (
  
          <div className="profile-edit-form">
  
            <div className="profile-form-grid">
  
              <SelectField
                label="Current status"
                name="status"
                value={draft.status}
                onChange={updateDraft}
                options={statusOptions}
              />
  
              <Field
                label="College / University"
                name="college"
                value={draft.college}
                onChange={updateDraft}
              />
  
              <Field
                label="Degree / Program"
                name="degree"
                value={draft.degree}
                onChange={updateDraft}
              />
  
              <SelectField
                label="Graduation year"
                name="graduationYear"
                value={
                  draft.graduationYear
                }
                onChange={updateDraft}
                options={
                  graduationYears.map(
                    (year) => [
                      String(year),
                      String(year),
                    ]
                  )
                }
              />
  
            </div>
  
          </div>
  
        );
      }
  
  
      return (
  
        <div className="profile-edit-form">
  
          <div className="profile-form-grid">
  
            <SelectField
              label="Target role"
              name="targetRole"
              value={draft.targetRole}
              onChange={updateDraft}
              options={roleOptions}
            />
  
            <SelectField
              label="Experience level"
              name="experience"
              value={draft.experience}
              onChange={updateDraft}
              options={experienceOptions}
            />
  
            <SelectField
              label="Primary interview focus"
              name="interviewFocus"
              value={
                draft.interviewFocus
              }
              onChange={updateDraft}
              options={focusOptions}
            />
  
            <SelectField
              label="Preferred programming language"
              name="programmingLanguage"
              value={
                draft.programmingLanguage
              }
              onChange={updateDraft}
              options={languageOptions}
            />
  
          </div>
  
        </div>
  
      );
    };
  
  
    /* =======================================================
       PAGE
    ======================================================= */
  
    return (
  
      <Navbar1>
  
        <main className="app-content profile-content">
  
          <div className="profile-page">
  
            {/* =================================================
                HEADER
            ================================================= */}
  
            <header className="profile-page-header">
  
              <div>
  
                <span className="profile-eyebrow">
  
                  <span />
  
                  YOUR PROFILE
  
                </span>
  
                <h1>
                  Profile & preferences
                </h1>
  
                <p>
                  Keep your information updated
                  so AI interviews can personalize
                  questions and practice sessions
                  around your goals.
                </p>
  
              </div>
  
              <button
                type="button"
                className="profile-back-button"
                onClick={() =>
                  navigate("/dashboard")
                }
              >
  
                <ArrowLeft size={16} />
  
                Dashboard
  
              </button>
  
            </header>
  
  
            {/* =================================================
                MESSAGES
            ================================================= */}
  
            {message && (
  
              <div className="profile-message">
  
                <Check size={16} />
  
                {message}
  
              </div>
  
            )}
  
  
            {error && (
  
              <div className="profile-error">
  
                <X size={16} />
  
                {error}
  
              </div>
  
            )}
  
  
            {/* =================================================
                PROFILE HERO
            ================================================= */}
  
            <section className="profile-hero">
  
              <div className="profile-photo-wrap">
  
                {photo ? (
  
                  <img
                    src={photo}
                    alt={`${fullName} profile`}
                    className="profile-photo"
                  />
  
                ) : (
  
                  <div className="profile-photo profile-photo-placeholder">
  
                    {initials}
  
                  </div>
  
                )}
  
                <label
                  className="photo-edit-button"
                  title="Change profile photo"
                >
  
                  <Camera size={15} />
  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handlePhotoChange
                    }
                  />
  
                </label>
  
              </div>
  
  
              <div className="profile-hero-info">
  
                <h2>
                  {fullName}
                </h2>
  
                <p>
                  {getLabel(
                    roleOptions,
                    profile.targetRole
                  )}
                </p>
  
                <div className="profile-hero-meta">
  
                  <span>
  
                    <Mail size={14} />
  
                    {profile.email ||
                      "Email not provided"}
  
                  </span>
  
                  <span>
  
                    <MapPin size={14} />
  
                    {profile.college ||
                      "Education not provided"}
  
                  </span>
  
                </div>
  
              </div>
  
  
              <div className="profile-hero-actions">
  
                {photo && (
  
                  <button
                    type="button"
                    className="ghost-danger-button"
                    onClick={
                      removePhoto
                    }
                  >
  
                    <Trash2 size={15} />
  
                    Remove photo
  
                  </button>
  
                )}
  
  
                <label
                  className="profile-photo-button"
                >
  
                  <Camera size={15} />
  
                  Change photo
  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handlePhotoChange
                    }
                  />
  
                </label>
  
              </div>
  
            </section>
  
  
            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}
  
            <section className="profile-section-card">
  
              <SectionHeader
                icon={UserRound}
                eyebrow="ACCOUNT"
                title="Personal information"
                description="Your basic contact and identity information."
                editing={
                  editingSection ===
                  "personal"
                }
                onEdit={() =>
                  beginEdit("personal")
                }
                onCancel={
                  cancelEdit
                }
                onSave={() =>
                  saveSection("personal")
                }
              />
  
              {editingSection ===
              "personal" ? (
  
                renderEditor(
                  "personal"
                )
  
              ) : (
  
                <div className="profile-info-grid">
  
                  <InfoItem
                    label="First name"
                    value={
                      profile.firstName
                    }
                  />
  
                  <InfoItem
                    label="Last name"
                    value={
                      profile.lastName
                    }
                  />
  
                  <InfoItem
                    label="Email address"
                    value={
                      profile.email
                    }
                    icon={Mail}
                    locked
                  />
  
                  <InfoItem
                    label="Phone number"
                    value={
                      profile.phone
                    }
                    icon={Phone}
                  />
  
                </div>
  
              )}
  
            </section>
  
  
            {/* =================================================
                EDUCATION
            ================================================= */}
  
            <section className="profile-section-card">
  
              <SectionHeader
                icon={GraduationCap}
                eyebrow="EDUCATION & BACKGROUND"
                title="Education & background"
                description="Your academic background and current professional status."
                editing={
                  editingSection ===
                  "education"
                }
                onEdit={() =>
                  beginEdit("education")
                }
                onCancel={
                  cancelEdit
                }
                onSave={() =>
                  saveSection("education")
                }
              />
  
              {editingSection ===
              "education" ? (
  
                renderEditor(
                  "education"
                )
  
              ) : (
  
                <div className="profile-info-grid">
  
                  <InfoItem
                    label="Current status"
                    value={getLabel(
                      statusOptions,
                      profile.status
                    )}
                  />
  
                  <InfoItem
                    label="College / University"
                    value={
                      profile.college
                    }
                  />
  
                  <InfoItem
                    label="Degree / Program"
                    value={
                      profile.degree
                    }
                  />
  
                  <InfoItem
                    label="Graduation year"
                    value={
                      profile.graduationYear
                    }
                  />
  
                </div>
  
              )}
  
            </section>
  
  
            {/* =================================================
                INTERVIEW PROFILE
            ================================================= */}
  
            <section className="profile-section-card">
  
              <SectionHeader
                icon={Target}
                eyebrow="INTERVIEW PROFILE"
                title="Interview preferences"
                description="These preferences personalize your future AI interview sessions."
                editing={
                  editingSection ===
                  "interview"
                }
                onEdit={() =>
                  beginEdit("interview")
                }
                onCancel={
                  cancelEdit
                }
                onSave={() =>
                  saveSection("interview")
                }
              />
  
              {editingSection ===
              "interview" ? (
  
                renderEditor(
                  "interview"
                )
  
              ) : (
  
                <div className="profile-info-grid">
  
                  <InfoItem
                    label="Target role"
                    value={getLabel(
                      roleOptions,
                      profile.targetRole
                    )}
                    icon={
                      BriefcaseBusiness
                    }
                  />
  
                  <InfoItem
                    label="Experience level"
                    value={getLabel(
                      experienceOptions,
                      profile.experience
                    )}
                  />
  
                  <InfoItem
                    label="Primary interview focus"
                    value={getLabel(
                      focusOptions,
                      profile.interviewFocus
                    )}
                    icon={Target}
                  />
  
                  <InfoItem
                    label="Preferred programming language"
                    value={getLabel(
                      languageOptions,
                      profile.programmingLanguage
                    )}
                    icon={Code2}
                  />
  
                </div>
  
              )}
  
            </section>
  
  
            {/* =================================================
                RESUME
            ================================================= */}
  
            <section className="profile-section-card resume-profile-card">
  
              <div className="profile-section-header">
  
                <div className="profile-section-title-wrap">
  
                  <div className="profile-section-icon">
  
                    <FileText size={19} />
  
                  </div>
  
                  <div>
  
                    <span className="profile-section-eyebrow">
  
                      RESUME
  
                    </span>
  
                    <h2>
                      Resume document
                    </h2>
  
                    <p>
                      Your resume is securely
                      associated with your account
                      and can be replaced anytime.
                    </p>
  
                  </div>
  
                </div>
  
  
                {/* =================================================
                    ADD BUTTON
                ================================================= */}
  
                {!resume &&
                  !resumeLoading && (
  
                  <label
                    className="resume-upload-button"
                  >
  
                    <Upload size={15} />
  
                    Add Resume
  
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={
                        handleResumeChange
                      }
                      disabled={
                        resumeActionLoading
                      }
                    />
  
                  </label>
  
                )}
  
              </div>
  
  
              {/* =================================================
                  LOADING
              ================================================= */}
  
              {resumeLoading ? (
  
                <div className="resume-empty-state">
  
                  <FileText size={22} />
  
                  <div>
  
                    <strong>
                      Loading resume...
                    </strong>
  
                    <span>
                      Checking your account.
                    </span>
  
                  </div>
  
                </div>
  
              ) : resume ? (
  
                /* =================================================
                   RESUME EXISTS
                ================================================= */
  
                <div className="resume-profile-file">
  
                  <div className="resume-file-icon-large">
  
                    <FileText size={25} />
  
                  </div>
  
  
                  <div className="resume-file-details">
  
                    <strong>
                      {resume.file_name}
                    </strong>
  
                    <span>
  
                      PDF ·{" "}
                      {formatFileSize(
                        resume.file_size
                      )}
  
                      {resume.uploaded_at &&
                        " · Uploaded "}
  
                      {resume.uploaded_at &&
                        new Date(
                          resume.uploaded_at
                        ).toLocaleDateString()}
  
                    </span>
  
                  </div>
  
  
                  {/* =================================================
                      RESUME ACTIONS
                  ================================================= */}
  
                  <div className="resume-file-actions">
  
                    {/* VIEW */}
  
                    <button
                      type="button"
                      className="resume-action secondary"
                      onClick={
                        handleViewResume
                      }
                      disabled={
                        resumeActionLoading
                      }
                    >
  
                      <ExternalLink size={15} />
  
                      View Resume
  
                    </button>
  
  
                    {/* REPLACE */}
  
                    <label
                      className="resume-action primary"
                    >
  
                      <Upload size={15} />
  
                      Replace Resume
  
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={
                          handleResumeChange
                        }
                        disabled={
                          resumeActionLoading
                        }
                      />
  
                    </label>
  
  
                    {/* DELETE */}
  
                    <button
                      type="button"
                      className="resume-action danger"
                      onClick={
                        removeResume
                      }
                      disabled={
                        resumeActionLoading
                      }
                    >
  
                      <Trash2 size={15} />
  
                      Delete
  
                    </button>
  
                  </div>
  
                </div>
  
              ) : (
  
                /* =================================================
                   NO RESUME
                ================================================= */
  
                <label className="resume-empty-state">
  
                  <div className="resume-empty-icon">
  
                    <FileText size={25} />
  
                  </div>
  
                  <div>
  
                    <strong>
                      No resume uploaded yet
                    </strong>
  
                    <span>
                      Click Add Resume above
                      to upload your PDF.
                    </span>
  
                  </div>
  
                  <Upload size={18} />
  
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={
                      handleResumeChange
                    }
                    disabled={
                      resumeActionLoading
                    }
                  />
  
                </label>
  
              )}
  
            </section>
  
  
            {/* =================================================
                SECURITY
            ================================================= */}
  
            <section className="profile-security-grid">
  
              <article className="profile-security-card">
  
                <div className="security-icon">
  
                  <ShieldCheck size={19} />
  
                </div>
  
                <div>
  
                  <span className="profile-section-eyebrow">
  
                    ACCOUNT SECURITY
  
                  </span>
  
                  <h3>
                    Password & authentication
                  </h3>
  
                  <p>
                    Your password is never
                    displayed on this page.
                  </p>
  
                </div>
  
                <button
                  type="button"
                  className="security-button"
                  onClick={() =>
                    navigate("/settings")
                  }
                >
  
                  Manage security
  
                  <ExternalLink size={14} />
  
                </button>
  
              </article>
  
  
              <article className="profile-security-card">
  
                <div className="security-icon green">
  
                  <Check size={19} />
  
                </div>
  
                <div>
  
                  <span className="profile-section-eyebrow">
  
                    AGREEMENT
  
                  </span>
  
                  <h3>
                    Terms & Privacy
                  </h3>
  
                  <p>
  
                    {profile.terms
                      ? "Terms of Service and Privacy Policy accepted during registration."
                      : "Agreement status is not available."}
  
                  </p>
  
                </div>
  
                <span className="agreement-badge">
  
                  {profile.terms
                    ? "Accepted"
                    : "Pending"}
  
                </span>
  
              </article>
  
            </section>
  
  
            {/* =================================================
                FOOTER
            ================================================= */}
  
            <footer className="profile-footer">
  
              <span>
  
                <Sparkles size={13} />
  
                Your profile powers
                personalized AI interview
                practice.
  
              </span>
  
              <span>
  
                Profile and resume data
                are stored through your
                authenticated account.
  
              </span>
  
            </footer>
  
          </div>
  
        </main>
  
      </Navbar1>
    );
  }
  
  
  /* =========================================================
     SECTION HEADER
  ========================================================= */
  
  function SectionHeader({
    icon: Icon,
    eyebrow,
    title,
    description,
    editing,
    onEdit,
    onCancel,
    onSave,
  }) {
  
    return (
  
      <div className="profile-section-header">
  
        <div className="profile-section-title-wrap">
  
          <div className="profile-section-icon">
  
            <Icon size={19} />
  
          </div>
  
          <div>
  
            <span className="profile-section-eyebrow">
  
              {eyebrow}
  
            </span>
  
            <h2>
              {title}
            </h2>
  
            <p>
              {description}
            </p>
  
          </div>
  
        </div>
  
  
        {editing ? (
  
          <div className="profile-edit-actions">
  
            <button
              type="button"
              className="profile-cancel-button"
              onClick={onCancel}
            >
  
              <X size={15} />
  
              Cancel
  
            </button>
  
            <button
              type="button"
              className="profile-save-button"
              onClick={onSave}
            >
  
              <Save size={15} />
  
              Save changes
  
            </button>
  
          </div>
  
        ) : (
  
          <button
            type="button"
            className="profile-edit-button"
            onClick={onEdit}
          >
  
            <Edit3 size={15} />
  
            Edit
  
          </button>
  
        )}
  
      </div>
  
    );
  }
  
  
  /* =========================================================
     INFO ITEM
  ========================================================= */
  
  function InfoItem({
    label,
    value,
    icon: Icon,
    locked = false,
  }) {
  
    return (
  
      <div className="profile-info-item">
  
        <span className="profile-info-label">
  
          {label}
  
          {locked && (
            <LockKeyhole size={12} />
          )}
  
        </span>
  
        <div className="profile-info-value">
  
          {Icon && (
            <Icon size={15} />
          )}
  
          <span>
            {value || "Not provided"}
          </span>
  
        </div>
  
      </div>
  
    );
  }
  
  
  /* =========================================================
     TEXT FIELD
  ========================================================= */
  
  function Field({
    label,
    name,
    value,
    onChange,
    type = "text",
  }) {
  
    return (
  
      <div className="profile-field">
  
        <label htmlFor={name}>
          {label}
        </label>
  
        <input
          id={name}
          name={name}
          type={type}
          value={value || ""}
          onChange={onChange}
        />
  
      </div>
  
    );
  }
  
  
  /* =========================================================
     SELECT FIELD
  ========================================================= */
  
  function SelectField({
    label,
    name,
    value,
    onChange,
    options,
  }) {
  
    return (
  
      <div className="profile-field">
  
        <label htmlFor={name}>
          {label}
        </label>
  
        <div className="profile-select-wrap">
  
          <select
            id={name}
            name={name}
            value={value || ""}
            onChange={onChange}
          >
  
            <option value="">
              Select {label.toLowerCase()}
            </option>
  
            {options.map(
              ([
                optionValue,
                optionLabel,
              ]) => (
  
                <option
                  key={optionValue}
                  value={optionValue}
                >
  
                  {optionLabel}
  
                </option>
  
              )
            )}
  
          </select>
  
          <ChevronDown size={16} />
  
        </div>
  
      </div>
  
    );
  }