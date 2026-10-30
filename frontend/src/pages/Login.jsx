import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import "../styles/auth.css";

import Navbar from "../components/Navbar";

import { loginUser } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
  
    if (!form.password) {
      setError("Please enter your password.");
      return;
    }
  
    try {
      const response = await loginUser({
        email: form.email,
        password: form.password,
      });
  
      if (!response.success) {
        setError(response.message);
        return;
      }
  
      localStorage.setItem(
        "access_token",
        response.token
      );
  
      localStorage.setItem(
        "userEmail",
        form.email
      );
  
      localStorage.setItem(
        "role",
        response.role
      );
  
      // Only a login initiated from the public Ask AI widget returns to Ask AI.
      // All normal logins retain the existing dashboard destination.
      let hasAskAIHandoff = false;
      try {
        const handoff = JSON.parse(sessionStorage.getItem("askAiHandoff") || "null");
        hasAskAIHandoff = Boolean(
          handoff &&
          handoff.createdAt &&
          Date.now() - handoff.createdAt < 2 * 60 * 60 * 1000 &&
          typeof handoff.pendingQuestion === "string" &&
          handoff.pendingQuestion.trim()
        );
      } catch {
        hasAskAIHandoff = false;
      }

      // A normal login starts a fresh temporary Ask AI conversation.
      // Keep the chat only when a valid public-to-private handoff is pending.
      // This also clears stale chat left behind by an inactivity timeout.
      if (!hasAskAIHandoff) {
        sessionStorage.removeItem("aiAskAIConversation");
        sessionStorage.removeItem("askAiHandoff");
      }

      navigate(hasAskAIHandoff ? "/ask-ai" : "/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Something went wrong. Please try again."
      );
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
                Welcome back
              </span>

              <h1>
                Welcome back.
              </h1>

              <p>
                Continue your interview preparation and
                keep improving.
              </p>

            </div>


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >

              {/* EMAIL */}

              <div className="input-group">

                <label>
                  Email address
                </label>

                <div className="input-wrapper">

                  <Mail size={17} />

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="input-group">

                <div className="label-row">

                  <label>
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="forgot-link"
                  >
                    Forgot password?
                  </Link>

                </div>


                <div className="input-wrapper">

                  <Lock size={17} />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}

                  </button>

                </div>

              </div>


              {/* ERROR */}

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}


              {/* SIGN IN */}

              <button
                type="submit"
                className="auth-submit"
               >
                Sign In
                <ArrowRight size={18} />

              </button>

            </form>


            {/* =================================================
                CREATE ACCOUNT
            ================================================= */}

            <div className="auth-create-account">

              <span>
                Don't have an account?
              </span>

              <Link to="/register">
                Create account
              </Link>

            </div>


            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="secure-note">

              Your account and interview profile
              stay connected.

            </div>

          </div>

        </section>

      </main>

    </div>
  );
} 