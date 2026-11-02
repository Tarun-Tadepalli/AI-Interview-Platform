import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import "../styles/auth.css";

import Navbar from "../components/Navbar";
import PasswordRules from "../components/PasswordRules";

import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} from "../services/authService";


export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);


  // Same password requirements as Register.
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    byteLength: new TextEncoder().encode(password).length <= 72,
  };

  const passwordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.byteLength;


  const handleRequestOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset(normalizedEmail);

      setEmail(normalizedEmail);
      setSuccess(
        response.message ||
        "If an account exists, a verification code has been sent."
      );

      setStep(2);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyPasswordResetOtp(email, otp);

      setResetToken(response.reset_token);
      setSuccess("Email verification successful.");

      setStep(3);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to verify the code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!passwordValid) {
      setError(
        "Password must meet all the required password rules."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        email,
        reset_token: resetToken,
        password,
      });

      setSuccess(
        response.message ||
        "Your password has been changed successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const goBack = () => {
    setError("");
    setSuccess("");

    if (step === 2) {
      setStep(1);
      setOtp("");
    } else if (step === 3) {
      setStep(2);
      setPassword("");
      setConfirmPassword("");
    }
  };


  return (
    <div className="auth-page">
      <Navbar />

      <main className="auth-main">
        <section className="auth-form-panel">

          <div className="auth-form-container">

            <div className="auth-heading">

              <span className="auth-small-label">
                ACCOUNT SECURITY
              </span>

              <h1>
                {step === 1 && "Forgot password?"}
                {step === 2 && "Verify your email"}
                {step === 3 && "Create new password"}
              </h1>

              <p>
                {step === 1 &&
                  "Enter your registered email address to receive a verification code."}

                {step === 2 &&
                  `Enter the 6-digit code sent to ${email}. The code expires in 5 minutes.`}

                {step === 3 &&
                  "Choose a new secure password for your account."}
              </p>

            </div>


            {/* STEP 1: EMAIL */}
            {step === 1 && (
              <form
                className="auth-form"
                onSubmit={handleRequestOtp}
              >

                <div className="input-group">
                  <label>Email address</label>

                  <div className="input-wrapper">
                    <Mail size={18} />

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="auth-error">{error}</p>
                )}

                {success && (
                  <p className="auth-success">{success}</p>
                )}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Verify email"}
                  {!loading && <ArrowRight size={18} />}
                </button>

              </form>
            )}


            {/* STEP 2: OTP */}
            {step === 2 && (
              <form
                className="auth-form"
                onSubmit={handleVerifyOtp}
              >

                <div className="input-group">
                  <label>Verification code</label>

                  <div className="input-wrapper">
                    <ShieldCheck size={18} />

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(event) => {
                        setOtp(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        );
                        setError("");
                      }}
                      required
                    />
                  </div>
                </div>

                <p className="forgot-secondary">
                  Check your inbox and spam folder.
                  The verification code is valid for 5 minutes.
                </p>

                {error && (
                  <p className="auth-error">{error}</p>
                )}

                {success && (
                  <p className="auth-success">{success}</p>
                )}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                  {!loading && <ArrowRight size={18} />}
                </button>

              </form>
            )}


            {/* STEP 3: NEW PASSWORD */}
            {step === 3 && (
              <form
                className="auth-form"
                onSubmit={handleResetPassword}
              >

                <div className="input-group">
                  <label>New password</label>

                  <div className="input-wrapper">
                    <Lock size={18} />

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />}
                    </button>
                  </div>
                </div>


                <div className="input-group">
                  <label>Confirm new password</label>

                  <div className="input-wrapper">
                    <Lock size={18} />

                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setError("");
                      }}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirm((previous) => !previous)
                      }
                      aria-label={
                        showConfirm
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirm
                         ? <EyeOff size={18} />
                         : <Eye size={18} />}
                    
                    </button>
                  </div>
                </div>


                <PasswordRules
                  password={password}
                  confirmPassword={confirmPassword}
                />

                {password && !passwordRules.byteLength && (
                  <p className="auth-error">
                    Password must not exceed 72 UTF-8 bytes.
                  </p>
                )}

                {error && (
                  <p className="auth-error">{error}</p>
                )}

                {success && (
                  <p className="auth-success">{success}</p>
                )}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Reset password"}
                  {!loading && <ArrowRight size={18} />}
                </button>

              </form>
            )}


            <div className="forgot-secondary">
              {step > 1 && (
                <button
                  type="button"
                  className="forgot-back-button"
                  onClick={goBack}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}

              <Link to="/login">
                Return to login
              </Link>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}