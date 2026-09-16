import { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import "../styles/auth.css";

import Navbar from "../components/Navbar";

export default function Login() {
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    /*
      TEMPORARY FRONTEND-ONLY LOGIN

      Backend authentication will be connected later.

      Planned backend flow:

      POST /auth/login

      Backend will:
      1. Verify email
      2. Verify hashed password
      3. Create authentication session/token
      4. Load user profile
      5. Load saved resume
      6. Redirect to dashboard
    */

    console.log("Login form:", form);
  };

  return (
    <div className="auth-page">
      <Navbar />



      {/* =====================================================
          LOGIN CONTENT
      ===================================================== */}

      <main className="auth-main">

        <section className="auth-form-panel">

          <div className="auth-form-container">

            {/* =================================================
                HEADING
            ================================================= */}

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
                <Link to="/dashboard">
                Sign In
                </Link>

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