import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Target,
  User,
} from "lucide-react";

import "../styles/auth.css";

import Navbar from "../components/Navbar";

import PasswordRules from "../components/PasswordRules";

import {
  registerUser,
  loginUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
} from "../services/authService";
const initialForm = {
  // Account
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",

  // Education / Background
  status: "",
  college: "",
  degree: "",
  graduationYear: "",

  // Interview profile
  targetRole: "",
  experience: "",
  interviewFocus: "",
  programmingLanguage: "",

  // Agreement
  terms: false,
};

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [form, setForm] = useState(initialForm);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordFocused, setPasswordFocused] = useState(false);

  const [error, setError] = useState("");

  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");

  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  const [verificationToken, setVerificationToken] = useState("");

  const [resendSeconds, setResendSeconds] = useState(0);
  const resendTimer = useRef(null);

  /*
  =========================================================
  PASSWORD VALIDATION
  =========================================================
  */

  const passwordRules = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };

  const passwordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  /*
  =========================================================
  HANDLE INPUT CHANGES
  =========================================================
  */

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const normalizedEmail = form.email.trim().toLowerCase();

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
  normalizedEmail
);

const handleEmailChange = (event) => {
  const newEmail = event.target.value;

  setForm((previous) => ({
    ...previous,
    email: newEmail,
  }));

  // A verified email becomes unverified if the address changes.
  if (
    newEmail.trim().toLowerCase() !== verifiedEmail
  ) {
    setEmailVerified(false);
    setVerifiedEmail("");
    setVerificationToken("");
    setOtp("");
    setOtpError("");
    setOtpMessage("");
  }

  setError("");
};


const startResendCooldown = () => {
  setResendSeconds(60);

  if (resendTimer.current) {
    clearInterval(resendTimer.current);
  }

  resendTimer.current = setInterval(() => {
    setResendSeconds((previous) => {
      if (previous <= 1) {
        clearInterval(resendTimer.current);
        resendTimer.current = null;
        return 0;
      }

      return previous - 1;
    });
  }, 1000);
};


const handleSendRegistrationOtp = async () => {
  if (!validEmail) {
    setError("Please enter a valid email address.");
    return;
  }

  try {
    setOtpLoading(true);
    setOtpError("");
    setOtpMessage("");

    const response = await requestRegistrationOtp(
      normalizedEmail
    );

    if (response.success) {
      setOtp("");
      setShowOtpPopup(true);
      setOtpMessage(
        "A 6-digit verification code has been sent to your email."
      );

      startResendCooldown();
    }
  } catch (error) {
    setOtpError(
      error.response?.data?.detail ||
      "Unable to send OTP. Please try again."
    );
  } finally {
    setOtpLoading(false);
  }
};


const handleVerifyRegistrationOtp = async () => {
  if (!/^\d{6}$/.test(otp)) {
    setOtpError("Please enter the complete 6-digit OTP.");
    return;
  }

  try {
    setOtpLoading(true);
    setOtpError("");

    const response = await verifyRegistrationOtp(
      normalizedEmail,
      otp
    );

    if (response.success && response.verification_token) {
      setEmailVerified(true);
      setVerifiedEmail(normalizedEmail);

      setVerificationToken(
        response.verification_token
      );

      setShowOtpPopup(false);
      setOtp("");
      setOtpMessage("");
      setOtpError("");
      setError("");
    }
  } catch (error) {
    setOtpError(
      error.response?.data?.detail ||
      "Incorrect OTP. Please try again."
    );
  } finally {
    setOtpLoading(false);
  }
};


const handleResendRegistrationOtp = async () => {
  if (resendSeconds > 0 || otpLoading) {
    return;
  }

  await handleSendRegistrationOtp();
};

  /*
  =========================================================
  STEP 1 VALIDATION
  =========================================================
  */

  const validateStepOne = () => {
    if (!form.firstName.trim()) {
      setError("Please enter your first name.");
      return false;
    }

    if (!form.lastName.trim()) {
      setError("Please enter your last name.");
      return false;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    if (!validEmail) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    if (
      !emailVerified ||
      verifiedEmail !== normalizedEmail ||
      !verificationToken
    ) {
      setError(
        "Please verify your email address before continuing."
      );
      return false;
    }

    if (!form.password) {
      setError("Please create a password.");
      return false;
    }

    if (!passwordValid) {
      setError(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return false;
    }

    if (!form.confirmPassword) {
      setError("Please confirm your password.");
      return false;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  /*
  =========================================================
  STEP 2 VALIDATION
  =========================================================
  */

  const validateStepTwo = () => {
    if (!form.status) {
      setError("Please select your current status.");
      return false;
    }

    if (!form.college.trim()) {
      setError("Please enter your college or university.");
      return false;
    }

    if (!form.degree.trim()) {
      setError("Please enter your degree or program.");
      return false;
    }

    if (!form.graduationYear) {
      setError("Please select your graduation year.");
      return false;
    }

    return true;
  };

  /*
  =========================================================
  STEP 3 VALIDATION
  =========================================================
  */

  const validateStepThree = () => {
    if (!form.targetRole) {
      setError("Please select your target role.");
      return false;
    }

    if (!form.experience) {
      setError("Please select your experience level.");
      return false;
    }

    if (!form.interviewFocus) {
      setError("Please select your interview focus.");
      return false;
    }

    if (!form.programmingLanguage) {
      setError("Please select your preferred programming language.");
      return false;
    }

    if (!form.terms) {
      setError(
        "Please accept the Terms of Service and Privacy Policy."
      );
      return false;
    }

    return true;
  };

  /*
  =========================================================
  NEXT STEP
  =========================================================
  */

  const nextStep = () => {
    let valid = false;

    if (step === 1) {
      valid = validateStepOne();
    }

    if (step === 2) {
      valid = validateStepTwo();
    }

    if (!valid) {
      return;
    }

    setError("");

    setStep((previous) => previous + 1);
  };

  /*
  =========================================================
  PREVIOUS STEP
  =========================================================
  */

  const previousStep = () => {
    setError("");

    setStep((previous) => Math.max(1, previous - 1));
  };

  /*
  =========================================================
  FINAL SUBMIT
  =========================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!validateStepThree()) {
      return;
    }
  
    try {
      const registrationData = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
  
        status: form.status,
        college: form.college.trim(),
        degree: form.degree.trim(),
        graduation_year: Number(form.graduationYear),
  
        target_role: form.targetRole,
        experience: form.experience,
        interview_focus: form.interviewFocus,
        programming_language: form.programmingLanguage,
  
        password: form.password,
        terms: form.terms,
        email_verification_token: verificationToken,
      };
  
      const registerResponse = await registerUser(
        registrationData
      );
  
      if (!registerResponse.success) {
        setError(
          registerResponse.message ||
          "Registration failed."
        );
        return;
      }

      if (
        !emailVerified ||
        verifiedEmail !== normalizedEmail ||
        !verificationToken
      ) {
        setError("Please verify your email address before registering.");
        return;
      }
  
      const loginResponse = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
  
      if (!loginResponse.success) {
        setError(
          "Account created successfully. Please login to continue."
        );
  
        navigate("/login");
        return;
      }
  
      localStorage.setItem(
        "access_token",
        loginResponse.token
      );
  
      localStorage.setItem(
        "userEmail",
        form.email.trim().toLowerCase()
      );
  
      localStorage.setItem(
        "role",
        loginResponse.role
      );
  
      navigate("/resume");
  
    } catch (error) {
      console.error("Registration error:", error);
  
      setError(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );
    }
  };

  /*
  =========================================================
  YEAR OPTIONS
  =========================================================
  */

  const graduationYears = Array.from(
    { length: 12 },
    (_, index) => 2025 + index
  );

  /*
  =========================================================
  UI
  =========================================================
  */

  return (
    <div className="auth-page register-page">
      <Navbar />


      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <main className="auth-form-panel">

        <div className="auth-form-container register-container">

          {/* =================================================
              HEADING
          ================================================= */}

          <div className="auth-heading register-heading">

            <div className="auth-small-label">
              <Sparkles size={14} />
              Build your interview profile
            </div>

            <h1>Create your account.</h1>

            <p>
              Tell us a little about yourself so your AI interview
              experience can be personalized from the beginning.
            </p>

          </div>


          {/* =================================================
              STEP INDICATOR
          ================================================= */}

          <div className="register-progress">

            {/* STEP 1 */}

            <div
              className={`register-step ${
                step >= 1 ? "active" : ""
              }`}
            >
              <div className="register-step-number">
                {step > 1 ? <Check size={15} /> : "01"}
              </div>

              <span>Account</span>
            </div>


            <div
              className={`register-progress-line ${
                step >= 2 ? "completed" : ""
              }`}
            />


            {/* STEP 2 */}

            <div
              className={`register-step ${
                step >= 2 ? "active" : ""
              }`}
            >
              <div className="register-step-number">
                {step > 2 ? <Check size={15} /> : "02"}
              </div>

              <span>Profile</span>
            </div>


            <div
              className={`register-progress-line ${
                step >= 3 ? "completed" : ""
              }`}
            />


            {/* STEP 3 */}

            <div
              className={`register-step ${
                step >= 3 ? "active" : ""
              }`}
            >
              <div className="register-step-number">
                03
              </div>

              <span>Interview</span>
            </div>

          </div>


          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="auth-form register-form"
          >

            {/* =================================================
                STEP 1 — ACCOUNT
            ================================================= */}

            {step === 1 && (
              <div className="register-step-content">

                <div className="register-section-title">
                  <User size={16} />
                  <span>Account information</span>
                </div>


                {/* FIRST + LAST NAME */}

                <div className="register-two-column">

                  <div className="input-group">

                    <label htmlFor="firstName">
                      First name
                    </label>

                    <div className="input-wrapper">

                      <User size={17} />

                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={form.firstName}
                        onChange={updateField}
                        autoComplete="given-name"
                      />

                    </div>

                  </div>


                  <div className="input-group">

                    <label htmlFor="lastName">
                      Last name
                    </label>

                    <div className="input-wrapper">

                      <User size={17} />

                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={form.lastName}
                        onChange={updateField}
                        autoComplete="family-name"
                      />

                    </div>

                  </div>

                </div>

                {/* EMAIL + VERIFICATION */}

                <div className="input-group">

                <label htmlFor="email">
                  Email address
                </label>

                <div className="register-email-row">

                  <div className="input-wrapper register-email-input">

                    <Mail size={17} />

                    <input
      id="email"
      type="email"
      name="email"
      placeholder="you@example.com"
      value={form.email}
      onChange={handleEmailChange}
      autoComplete="email"
    />

  </div>

  {emailVerified && verifiedEmail === normalizedEmail ? (

    <div className="email-verified-button">
      <CheckCircle2 size={16} />
      Verified
    </div>

  ) : (

    <button
      type="button"
      className="email-verify-button"
      onClick={handleSendRegistrationOtp}
      disabled={!validEmail || otpLoading}
    >
      {otpLoading ? "Sending..." : "Verify"}
    </button>

  )}

</div>

{emailVerified && verifiedEmail === normalizedEmail && (
  <p className="email-verified-note">
    Your email address has been successfully verified.
  </p>
)}

</div>


                {/* PHONE */}

                <div className="input-group">

                  <label htmlFor="phone">
                    Phone number
                    <span className="optional-label">
                      Optional
                    </span>
                  </label>

                  <div className="input-wrapper">

                    <Phone size={17} />

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={updateField}
                      autoComplete="tel"
                    />

                  </div>

                </div>


                {/* PASSWORD + CONFIRM */}

                <div className="register-two-column">

                  {/* PASSWORD */}

                  <div className="input-group">

                    <label htmlFor="password">
                      Password
                    </label>

                    <div className="input-wrapper">

                      <Lock size={17} />

                      <input
                        id="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={updateField}
                        onFocus={() =>
                          setPasswordFocused(true)
                        }
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        onClick={() =>
                          setShowPassword(
                            (previous) => !previous
                          )
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>

                    </div>


                    {/* PASSWORD RULES */}

                    {passwordFocused && (
                      <PasswordRules
                        password={form.password}
                        confirmPassword={form.confirmPassword}
                      />
                    )}

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div className="input-group">

                    <label htmlFor="confirmPassword">
                      Confirm password
                    </label>

                    <div
                      className={`input-wrapper ${
                        form.confirmPassword
                          ? passwordsMatch
                            ? "input-valid"
                            : "input-invalid"
                          : ""
                      }`}
                    >

                      <Lock size={17} />

                      <input
                        id="confirmPassword"
                        type={
                          showConfirm
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        placeholder="Repeat password"
                        value={form.confirmPassword}
                        onChange={updateField}
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        aria-label={
                          showConfirm
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() =>
                          setShowConfirm(
                            (previous) => !previous
                          )
                        }
                      >
                        {showConfirm ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>

                    </div>

                  </div>

                </div>


                {/* CONTINUE */}

                <button
                  type="button"
                  className="auth-submit register-next"
                  onClick={nextStep}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>

              </div>
            )}


            {/* =================================================
                STEP 2 — PROFILE
            ================================================= */}

            {step === 2 && (
              <div className="register-step-content">

                <div className="register-section-title">
                  <GraduationCap size={17} />
                  <span>Education & background</span>
                </div>


                {/* CURRENT STATUS */}

                <div className="input-group">

                  <label htmlFor="status">
                    Current status
                  </label>

                  <div className="select-wrapper">

                    <GraduationCap size={17} />

                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={updateField}
                    >
                      <option value="">
                        Select your current status
                      </option>

                      <option value="student">
                        Student
                      </option>

                      <option value="graduate">
                        Graduate
                      </option>

                      <option value="working-professional">
                        Working Professional
                      </option>

                      <option value="career-switcher">
                        Career Switcher
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>


                {/* COLLEGE */}

                <div className="input-group">

                  <label htmlFor="college">
                    College / University
                  </label>

                  <div className="input-wrapper">

                    <GraduationCap size={17} />

                    <input
                      id="college"
                      type="text"
                      name="college"
                      placeholder="Your college or university"
                      value={form.college}
                      onChange={updateField}
                    />

                  </div>

                </div>


                {/* DEGREE */}

                <div className="input-group">

                  <label htmlFor="degree">
                    Degree / Program
                  </label>

                  <div className="input-wrapper">

                    <GraduationCap size={17} />

                    <input
                      id="degree"
                      type="text"
                      name="degree"
                      placeholder="e.g. B.Tech Computer Science"
                      value={form.degree}
                      onChange={updateField}
                    />

                  </div>

                </div>


                {/* GRADUATION YEAR */}

                <div className="input-group">

                  <label htmlFor="graduationYear">
                    Graduation year
                  </label>

                  <div className="select-wrapper">

                    <GraduationCap size={17} />

                    <select
                      id="graduationYear"
                      name="graduationYear"
                      value={form.graduationYear}
                      onChange={updateField}
                    >

                      <option value="">
                        Select graduation year
                      </option>

                      {graduationYears.map((year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      ))}

                    </select>

                  </div>

                </div>


                {/* NAVIGATION */}

                <div className="register-navigation">

                  <button
                    type="button"
                    className="register-back-button"
                    onClick={previousStep}
                  >
                    <ArrowLeft size={17} />
                    Back
                  </button>


                  <button
                    type="button"
                    className="auth-submit register-next"
                    onClick={nextStep}
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>

                </div>

              </div>
            )}


            {/* =================================================
                STEP 3 — INTERVIEW PROFILE
            ================================================= */}

            {step === 3 && (
              <div className="register-step-content">

                <div className="register-section-title">
                  <Target size={17} />
                  <span>Interview profile</span>
                </div>


                {/* TARGET ROLE */}

                <div className="input-group">

                  <label htmlFor="targetRole">
                    Target role
                  </label>

                  <div className="select-wrapper">

                    <BriefcaseBusiness size={17} />

                    <select
                      id="targetRole"
                      name="targetRole"
                      value={form.targetRole}
                      onChange={updateField}
                    >

                      <option value="">
                        Select target role
                      </option>

                      <option value="software-developer">
                        Software Developer
                      </option>

                      <option value="frontend-developer">
                        Frontend Developer
                      </option>

                      <option value="backend-developer">
                        Backend Developer
                      </option>

                      <option value="fullstack-developer">
                        Full Stack Developer
                      </option>

                      <option value="data-scientist">
                        Data Scientist
                      </option>

                      <option value="data-analyst">
                        Data Analyst
                      </option>

                      <option value="ai-ml-engineer">
                        AI / ML Engineer
                      </option>

                      <option value="cloud-engineer">
                        Cloud Engineer
                      </option>

                      <option value="devops-engineer">
                        DevOps Engineer
                      </option>

                      <option value="cybersecurity-engineer">
                        Cybersecurity Engineer
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>


                {/* EXPERIENCE */}

                <div className="input-group">

                  <label htmlFor="experience">
                    Experience level
                  </label>

                  <div className="select-wrapper">

                    <BriefcaseBusiness size={17} />

                    <select
                      id="experience"
                      name="experience"
                      value={form.experience}
                      onChange={updateField}
                    >

                      <option value="">
                        Select experience level
                      </option>

                      <option value="fresher">
                        Fresher
                      </option>

                      <option value="0-1">
                        0–1 years
                      </option>

                      <option value="1-3">
                        1–3 years
                      </option>

                      <option value="3-5">
                        3–5 years
                      </option>

                      <option value="5+">
                        5+ years
                      </option>

                    </select>

                  </div>

                </div>


                {/* INTERVIEW FOCUS */}

                <div className="input-group">

                  <label htmlFor="interviewFocus">
                    Primary interview focus
                  </label>

                  <div className="select-wrapper">

                    <Target size={17} />

                    <select
                      id="interviewFocus"
                      name="interviewFocus"
                      value={form.interviewFocus}
                      onChange={updateField}
                    >

                      <option value="">
                        Select interview focus
                      </option>

                      <option value="technical">
                        Technical
                      </option>

                      <option value="behavioral">
                        HR / Behavioral
                      </option>

                      <option value="coding">
                        Coding
                      </option>

                      <option value="ai-ml">
                        AI / ML
                      </option>

                      <option value="system-design">
                        System Design
                      </option>

                      <option value="mixed">
                        Mixed
                      </option>

                    </select>

                  </div>

                </div>


                {/* PROGRAMMING LANGUAGE */}

                <div className="input-group">

                  <label htmlFor="programmingLanguage">
                    Preferred programming language
                  </label>

                  <div className="select-wrapper">

                    <Code2 size={17} />

                    <select
                      id="programmingLanguage"
                      name="programmingLanguage"
                      value={form.programmingLanguage}
                      onChange={updateField}
                    >

                      <option value="">
                        Select language
                      </option>

                      <option value="python">
                        Python
                      </option>

                      <option value="java">
                        Java
                      </option>

                      <option value="javascript">
                        JavaScript
                      </option>

                      <option value="typescript">
                        TypeScript
                      </option>

                      <option value="cpp">
                        C++
                      </option>

                      <option value="c">
                        C
                      </option>

                      <option value="csharp">
                        C#
                      </option>

                      <option value="go">
                        Go
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>


                {/* TERMS */}

                <label className="terms-row">

                  <input
                    type="checkbox"
                    name="terms"
                    checked={form.terms}
                    onChange={updateField}
                  />

                  <span>
                    I agree to the Terms of Service and
                    Privacy Policy.
                  </span>

                </label>


                {/* NAVIGATION */}

                <div className="register-navigation">

                  <button
                    type="button"
                    className="register-back-button"
                    onClick={previousStep}
                  >
                    <ArrowLeft size={17} />
                    Back
                  </button>


                  <button
                    type="submit"
                    className="auth-submit register-next"
                  >
                    Create account
                    <ArrowRight size={18} />
                  </button>

                </div>

              </div>
            )}


            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

          </form>

          
{showOtpPopup && (
  <div
    className="email-otp-overlay"
    onClick={(event) => {
      if (event.target === event.currentTarget && !otpLoading) {
        setShowOtpPopup(false);
      }
    }}
  >
    <div
      className="email-otp-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-otp-title"
    >
      <button
        type="button"
        className="email-otp-close"
        onClick={() => setShowOtpPopup(false)}
        disabled={otpLoading}
        aria-label="Close verification popup"
      >
        ×
      </button>

      <div className="email-otp-icon">
        <Mail size={25} />
      </div>

      <h2 id="email-otp-title">Verify your email</h2>

      <p>
        Enter the 6-digit verification code sent to:
      </p>

      <strong className="email-otp-address">
        {normalizedEmail}
      </strong>

      <input
        className="email-otp-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChange={(event) => {
          setOtp(
            event.target.value.replace(/\D/g, "").slice(0, 6)
          );
          setOtpError("");
        }}
      />

      {otpMessage && (
        <p className="email-otp-success">
          {otpMessage}
        </p>
      )}

      {otpError && (
        <p className="email-otp-error" role="alert">
          {otpError}
        </p>
      )}

      <button
        type="button"
        className="email-otp-verify"
        onClick={handleVerifyRegistrationOtp}
        disabled={otpLoading || otp.length !== 6}
      >
        {otpLoading ? "Verifying..." : "Verify OTP"}
      </button>

      <div className="email-otp-resend">
        Didn't receive the code?

        <button
          type="button"
          onClick={handleResendRegistrationOtp}
          disabled={otpLoading || resendSeconds > 0}
        >
          {resendSeconds > 0
            ? `Resend in ${resendSeconds}s`
            : "Resend OTP"}
        </button>
      </div>
    </div>
  </div>
)}



          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <div className="secure-note">

            <CheckCircle2 size={16} />

            <span>
              Your profile will power personalized AI interviews
            </span>

          </div>


          {/* =================================================
              LOGIN LINK
          ================================================= */}

          <div className="auth-switch">

            Already have an account?

            <Link to="/login">
              Sign in
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}