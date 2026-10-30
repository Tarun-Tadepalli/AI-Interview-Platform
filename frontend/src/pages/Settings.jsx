import React, { useState } from "react";
import {
  Lock,
  Mail,
  Phone,
  Bell,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
  UserRound,
  FileText,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar1 from "../components/Navbar1";
import api from "../services/api";
import "../styles/settings.css";

const getApiErrorMessage = (
  requestError,
  fallbackMessage
) => {
  const detail = requestError?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || "Invalid request.")
      .join(" ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  const message =
    requestError?.response?.data?.message;

  if (typeof message === "string") {
    return message;
  }

  return fallbackMessage;
};


/* =========================================================
   TOGGLE
   ========================================================= */

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className={`settings-toggle ${checked ? "active" : ""}`}
    onClick={(event) => {
      event.stopPropagation();
      onChange(!checked);
    }}
    aria-label="Toggle setting"
  >
    <span />
  </button>
);


/* =========================================================
   SETTINGS ROW
   ========================================================= */

const SettingsRow = ({
  icon: Icon,
  title,
  description,
  children,
  onClick,
  danger = false,
}) => (
  <div
    className={`settings-row ${danger ? "danger-row" : ""}`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(event) => {
      if (
        onClick &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        onClick();
      }
    }}
  >
    <div className="settings-row-icon">
      <Icon size={20} />
    </div>

    <div className="settings-row-info">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>

    <div className="settings-row-action">
      {children || <ChevronRight size={20} />}
    </div>
  </div>
);


/* =========================================================
   SETTINGS PAGE
   ========================================================= */

export default function Settings() {
  const navigate = useNavigate();


  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  const [notifications, setNotifications] = useState({
    interviewReminders: true,
    practiceReminders: true,
    emailNotifications: false,
  });


  /* =======================================================
     MESSAGE / ERROR
     ======================================================= */

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /* =======================================================
     ACCOUNT MODAL
     ======================================================= */

     const [emailModalOpen, setEmailModalOpen] = useState(false);

     const [phoneModalOpen, setPhoneModalOpen] = useState(false);
     
     const [accountForm, setAccountForm] = useState({
       email: "",
       phone: "",
     });
     
     const [accountLoading, setAccountLoading] = useState(false);


  /* =======================================================
     PASSWORD MODAL
     ======================================================= */

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);


  /* =======================================================
     DELETE ACCOUNT
     ======================================================= */

  const [deleteLoading, setDeleteLoading] = useState(false);


  /* =======================================================
     SHOW MESSAGE
     ======================================================= */

  const showMessage = (text) => {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };


  /* =======================================================
     SHOW ERROR
     ======================================================= */

  const showError = (text) => {
    setError(text);
    setMessage("");

    window.setTimeout(() => {
      setError("");
    }, 4000);
  };


  /* =======================================================
     LOAD CURRENT ACCOUNT INFORMATION
     ======================================================= */

     const openEmailModal = () => {
      setMessage("");
      setError("");
      setAccountError("");
    
      let currentUser = {};
    
      try {
        const storedUser = localStorage.getItem("currentUser");
    
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (storageError) {
        console.error(
          "Unable to read current user:",
          storageError
        );
      }
    
      setAccountForm({
        email:
          currentUser.email ||
          currentUser.email_address ||
          localStorage.getItem("userEmail") ||
          "",
        phone:
          currentUser.phone ||
          "",
      });
    
      setEmailModalOpen(true);
    };
    
    
    const openPhoneModal = () => {
      setMessage("");
      setError("");
      setAccountError("");
    
      let currentUser = {};
    
      try {
        const storedUser = localStorage.getItem("currentUser");
    
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (storageError) {
        console.error(
          "Unable to read current user:",
          storageError
        );
      }
    
      setAccountForm({
        email:
          currentUser.email ||
          currentUser.email_address ||
          localStorage.getItem("userEmail") ||
          "",
        phone:
          currentUser.phone ||
          "",
      });
    
      setPhoneModalOpen(true);
    };


  /* =======================================================
     ACCOUNT FORM CHANGE
     ======================================================= */

     const handleAccountChange = (event) => {
      const { name, value } = event.target;
    
      setAccountForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    
      setAccountError("");
    };


  /* =======================================================
     UPDATE ACCOUNT
     ======================================================= */

     const handleAccountUpdate = async (event) => {
      event.preventDefault();

      setMessage("");
      setError("");
      setAccountError("");
    
      try {
        const isEmailUpdate = emailModalOpen;

        if (!isEmailUpdate) {
          const phone = accountForm.phone.trim();
        
          if (!/^[6-9]\d{9}$/.test(phone)) {
            setAccountError(
              "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9."
            );
            return;
          }
        }
    
        const requestData = isEmailUpdate
          ? {
              email: accountForm.email.trim(),
            }
          : {
              phone: accountForm.phone.trim(),
            };
    
        const response = await api.patch(
          "/users/me",
          requestData
        );
    
        const responseData = response.data || {};
    
        let oldUser = {};
    
        try {
          const storedUser =
            localStorage.getItem("currentUser");
    
          if (storedUser) {
            oldUser = JSON.parse(storedUser);
          }
        } catch (storageError) {
          console.error(
            "Unable to read stored user:",
            storageError
          );
        }
    
        const updatedUser =
          responseData.user ||
          responseData.profile ||
          responseData.account ||
          null;
    
        const mergedUser = {
          ...oldUser,
          ...(updatedUser || {}),
        };
    
        if (isEmailUpdate) {
          mergedUser.email =
            updatedUser?.email ||
            accountForm.email.trim();
    
          localStorage.setItem(
            "userEmail",
            mergedUser.email
          );
        }
    
        if (!isEmailUpdate) {
          mergedUser.phone =
            updatedUser?.phone ||
            accountForm.phone.trim();
        }
    
        localStorage.setItem(
          "currentUser",
          JSON.stringify(mergedUser)
        );
    
        setEmailModalOpen(false);
        setPhoneModalOpen(false);
    
        showMessage(
          responseData.message ||
            `${
              isEmailUpdate
                ? "Email address"
                : "Phone number"
            } updated successfully.`
        );
    
        window.dispatchEvent(
          new Event("storage")
        );
    
      } catch (requestError) {
        console.error(
          "Account update error:",
          requestError
        );
    
        const backendMessage =
          requestError.response?.data?.detail ||
          requestError.response?.data?.message ||
          "Unable to update account information.";
    
        setAccountError(backendMessage);
    
      } finally {
        setAccountLoading(false);
      }
    };


  /* =======================================================
     PASSWORD FORM CHANGE
     ======================================================= */

     const handlePasswordChange = (event) => {
      const { name, value } = event.target;
    
      setPasswordForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    
      setPasswordError("");
    };


  /* =======================================================
     OPEN PASSWORD MODAL
     ======================================================= */

  const openPasswordModal = () => {
    setMessage("");
    setError("");
    setPasswordError("");

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setPasswordModalOpen(true);
  };


  /* =======================================================
     CHANGE PASSWORD
     ======================================================= */

     const handlePasswordUpdate = async (event) => {
      event.preventDefault();
    
      setMessage("");
      setError("");
      setPasswordError("");
    
      if (!passwordForm.currentPassword) {
        setPasswordError("Please enter your current password.");
        return;
      }
    
      if (!passwordForm.newPassword) {
        setPasswordError("Please enter your new password.");
        return;
      }
    
      if (passwordForm.newPassword.length < 8) {
        setPasswordError(
          "New password must contain at least 8 characters."
        );
        return;
      }
    
      if (!/[A-Z]/.test(passwordForm.newPassword)) {
        setPasswordError(
          "New password must contain at least one uppercase letter."
        );
        return;
      }
    
      if (!/[a-z]/.test(passwordForm.newPassword)) {
        setPasswordError(
          "New password must contain at least one lowercase letter."
        );
        return;
      }
    
      if (!/[0-9]/.test(passwordForm.newPassword)) {
        setPasswordError(
          "New password must contain at least one number."
        );
        return;
      }
    
      if (!/[^A-Za-z0-9]/.test(passwordForm.newPassword)) {
        setPasswordError(
          "New password must contain at least one special character."
        );
        return;
      }
    
      if (!passwordForm.confirmPassword) {
        setPasswordError(
          "Please confirm your new password."
        );
        return;
      }
    
      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {
        setPasswordError(
          "New passwords do not match."
        );
        return;
      }
    
      setPasswordLoading(true);
    
      try {
        await api.patch(
          "/users/me/password",
          {
            current_password:
              passwordForm.currentPassword,
    
            new_password:
              passwordForm.newPassword,
    
            confirm_password:
              passwordForm.confirmPassword,
          }
        );
    
        setPasswordModalOpen(false);
    
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
    
        showMessage(
          "Password changed successfully."
        );
    
      } catch (requestError) {
        console.error(
          "Password change error:",
          requestError
        );
    
        const backendMessage = getApiErrorMessage(
          requestError,
          "Unable to change password."
        );
    
        setPasswordError(backendMessage);
    
      } finally {
        setPasswordLoading(false);
      }
    };


  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("pendingRegistration");
    localStorage.removeItem("aiInterviewResume");

    navigate("/login");
  };


  /* =======================================================
     DELETE ACCOUNT
     ======================================================= */

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = window.confirm(
      "Your account and associated data will be permanently deleted. Continue?"
    );

    if (!secondConfirmation) {
      return;
    }

    setDeleteLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.delete(
        "/users/me"
      );

      console.log(
        "Account deletion response:",
        response.data
      );

      /*
       * Clear every authentication/local account value.
       */
      localStorage.removeItem("access_token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("role");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("pendingRegistration");
      localStorage.removeItem("aiInterviewResume");

      navigate("/login");

    } catch (requestError) {
      console.error(
        "Account deletion error:",
        requestError
      );

      const backendMessage =
        requestError.response?.data?.detail ||
        requestError.response?.data?.message ||
        "Unable to delete your account.";

      showError(backendMessage);

    } finally {
      setDeleteLoading(false);
    }
  };


  /* =======================================================
     CLOSE MODALS
     ======================================================= */

     const closeEmailModal = () => {
      if (accountLoading) {
        return;
      }
    
      setEmailModalOpen(false);
    };
    
    const closePhoneModal = () => {
      if (accountLoading) {
        return;
      }
    
      setPhoneModalOpen(false);
    };

  const closePasswordModal = () => {
    if (passwordLoading) {
      return;
    }

    setPasswordModalOpen(false);
  };


  /* =======================================================
     UI
     ======================================================= */

  return (
    <Navbar1>
      <main className="app-content settings-content">

        <div className="settings-page">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="settings-header">

            <span className="settings-eyebrow">
              <span />
              ACCOUNT SETTINGS
            </span>

            <h1>Settings</h1>

            <p>
              Manage your account, security, notifications
              and account preferences.
            </p>

          </header>


          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {message && (
            <div className="settings-message">
              <Check size={17} />
              <span>{message}</span>
            </div>
          )}


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (
            <div className="settings-error">
              <X size={17} />
              <span>{error}</span>
            </div>
          )}


          {/* =================================================
              ACCOUNT
          ================================================= */}

          <section className="settings-section">

            <div className="settings-section-heading">

              <div className="settings-section-icon">
                <UserRound size={20} />
              </div>

              <div>
                <span className="settings-section-eyebrow">
                  ACCOUNT
                </span>

                <h2>Account Information</h2>

                <p>
                  Manage the information connected to your
                  account.
                </p>
              </div>

            </div>


            <div className="settings-card">

              <SettingsRow
                icon={Mail}
                title="Email Address"
                description="Update the email address connected to your account."
                onClick={openEmailModal}
              />

              <SettingsRow
                icon={Phone}
                title="Phone Number"
                description="Update the phone number connected to your account."
                onClick={openPhoneModal}
              />

              <SettingsRow
                icon={UserRound}
                title="Profile Information"
                description="View and manage your personal, education and interview information."
                onClick={() => navigate("/profile")}
              />

            </div>

          </section>


          {/* =================================================
              SECURITY
          ================================================= */}

          <section className="settings-section">

            <div className="settings-section-heading">

              <div className="settings-section-icon">
                <Shield size={20} />
              </div>

              <div>

                <span className="settings-section-eyebrow">
                  SECURITY
                </span>

                <h2>Password & Authentication</h2>

                <p>
                  Keep your account secure and manage
                  authentication controls.
                </p>

              </div>

            </div>


            <div className="settings-card">

              <SettingsRow
                icon={Lock}
                title="Change Password"
                description="Update your password to keep your account protected."
                onClick={openPasswordModal}
              />

            </div>

          </section>


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <section className="settings-section">

            <div className="settings-section-heading">

              <div className="settings-section-icon">
                <Bell size={20} />
              </div>

              <div>

                <span className="settings-section-eyebrow">
                  PREFERENCES
                </span>

                <h2>Notifications</h2>

                <p>
                  Choose which reminders and notifications
                  you receive.
                </p>

              </div>

            </div>


            <div className="settings-card">

              <SettingsRow
                icon={Bell}
                title="Interview Reminders"
                description="Receive reminders about scheduled interview practice."
              >
                <Toggle
                  checked={
                    notifications.interviewReminders
                  }
                  onChange={(value) =>
                    setNotifications({
                      ...notifications,
                      interviewReminders: value,
                    })
                  }
                />
              </SettingsRow>


              <SettingsRow
                icon={Bell}
                title="Practice Reminders"
                description="Receive reminders to continue your practice sessions."
              >
                <Toggle
                  checked={
                    notifications.practiceReminders
                  }
                  onChange={(value) =>
                    setNotifications({
                      ...notifications,
                      practiceReminders: value,
                    })
                  }
                />
              </SettingsRow>


              <SettingsRow
                icon={Mail}
                title="Email Notifications"
                description="Receive useful account and platform updates by email."
              >
                <Toggle
                  checked={
                    notifications.emailNotifications
                  }
                  onChange={(value) =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: value,
                    })
                  }
                />
              </SettingsRow>

            </div>

          </section>


          {/* =================================================
              DANGER ZONE
          ================================================= */}

          <section className="settings-section">

            <div className="settings-section-heading danger-heading">

              <div className="settings-section-icon">
                <Shield size={20} />
              </div>

              <div>

                <span className="settings-section-eyebrow">
                  ACCOUNT CONTROL
                </span>

                <h2>Danger Zone</h2>

                <p>
                  Actions that affect your account access
                  or account data.
                </p>

              </div>

            </div>


            <div className="settings-card danger-card">

              <SettingsRow
                icon={LogOut}
                title="Log Out"
                description="Sign out of your current account."
                danger
                onClick={handleLogout}
              />


              <SettingsRow
                icon={Trash2}
                title={
                  deleteLoading
                    ? "Deleting Account..."
                    : "Delete Account"
                }
                description="Permanently delete your account and associated data."
                danger
                onClick={
                  deleteLoading
                    ? undefined
                    : handleDeleteAccount
                }
              />

            </div>

          </section>


          {/* =================================================
              LEGAL
          ================================================= */}

          <section className="settings-section legal-section">

            <div className="legal-card">

              <div className="legal-card-info">

                <FileText size={19} />

                <div>

                  <h2>Terms & Privacy</h2>

                  <p>
                    Review the documents related to using
                    AI Interview Platform.
                  </p>

                </div>

              </div>


              <div className="legal-links">

                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                >
                  Terms & Conditions
                  <ChevronRight size={16} />
                </button>


                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                >
                  Privacy Policy
                  <ChevronRight size={16} />
                </button>

              </div>

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="settings-footer">

            <span>
              AI Interview Training Platform
            </span>

            <span>
              Keep learning. Keep improving.
            </span>

          </footer>

        </div>


        {/* ===================================================
            ACCOUNT UPDATE MODAL
        =================================================== */}

{emailModalOpen && (
  <div
    className="settings-modal-overlay"
    onMouseDown={closeEmailModal}
  >
    <div
      className="settings-modal"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <div className="settings-modal-header">
        <div>
          <span className="settings-modal-eyebrow">
            ACCOUNT
          </span>

          <h2>Update email address</h2>

          <p>
            Update the email address connected to your account.
          </p>
        </div>

        <button
          type="button"
          className="settings-modal-close"
          onClick={closeEmailModal}
          disabled={accountLoading}
          aria-label="Close"
        >
          <X size={19} />
        </button>
      </div>

      <form
        className="settings-modal-form"
        onSubmit={handleAccountUpdate}
      >
        <div className="settings-input-group">
          <label htmlFor="settings-email">
            Email address
          </label>

          <div className="settings-input-wrapper">
            <Mail size={17} />

            <input
              id="settings-email"
              type="email"
              name="email"
              value={accountForm.email}
              onChange={handleAccountChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        {accountError && emailModalOpen && (
          <div className="settings-modal-error">
            <X size={16} />
            <span>{accountError}</span>
          </div>
        )}

        <div className="settings-modal-actions">
          <button
            type="button"
            className="settings-secondary-button"
            onClick={closeEmailModal}
            disabled={accountLoading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="settings-primary-button"
            disabled={accountLoading}
          >
            {accountLoading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{phoneModalOpen && (
  <div
    className="settings-modal-overlay"
    onMouseDown={closePhoneModal}
  >
    <div
      className="settings-modal"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <div className="settings-modal-header">
        <div>
          <span className="settings-modal-eyebrow">
            ACCOUNT
          </span>

          <h2>Update phone number</h2>

          <p>
            Update the phone number connected to your account.
          </p>
        </div>

        <button
          type="button"
          className="settings-modal-close"
          onClick={closePhoneModal}
          disabled={accountLoading}
          aria-label="Close"
        >
          <X size={19} />
        </button>
      </div>

      <form
        className="settings-modal-form"
        onSubmit={handleAccountUpdate}
      >
        <div className="settings-input-group">
          <label htmlFor="settings-phone">
            Phone number
          </label>

          <div className="settings-input-wrapper">
            <Phone size={17} />

            <input
              id="settings-phone"
              type="tel"
              name="phone"
              value={accountForm.phone}
              onChange={handleAccountChange}
              placeholder="Enter phone number"
              autoComplete="tel"
              required
            />
          </div>
        </div>

        {accountError && phoneModalOpen && (
          <div className="settings-modal-error">
            <X size={16} />
            <span>{accountError}</span>
          </div>
        )}

        <div className="settings-modal-actions">
          <button
            type="button"
            className="settings-secondary-button"
            onClick={closePhoneModal}
            disabled={accountLoading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="settings-primary-button"
            disabled={accountLoading}
          >
            {accountLoading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


        {/* ===================================================
            PASSWORD MODAL
        =================================================== */}

        {passwordModalOpen && (
          <div
            className="settings-modal-overlay"
            onMouseDown={closePasswordModal}
          >

            <div
              className="settings-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="settings-modal-header">

                <div>
                  <span className="settings-modal-eyebrow">
                    SECURITY
                  </span>

                  <h2>
                    Change password
                  </h2>

                  <p>
                    Enter your current password and choose
                    a new password.
                  </p>
                </div>

                <button
                  type="button"
                  className="settings-modal-close"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  aria-label="Close"
                >
                  <X size={19} />
                </button>

              </div>


              <form
                className="settings-modal-form"
                onSubmit={handlePasswordUpdate}
              >

                {/* CURRENT PASSWORD */}

                <div className="settings-input-group">

                  <label htmlFor="current-password">
                    Current password
                  </label>

                  <div className="settings-input-wrapper">

                    <Lock size={17} />

                    <input
                      id="current-password"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      name="currentPassword"
                      value={
                        passwordForm.currentPassword
                      }
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="settings-password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(
                          (previous) => !previous
                        )
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>


                {/* NEW PASSWORD */}

                <div className="settings-input-group">

                  <label htmlFor="new-password">
                    New password
                  </label>

                  <div className="settings-input-wrapper">

                    <Lock size={17} />

                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      name="newPassword"
                      value={
                        passwordForm.newPassword
                      }
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="settings-password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          (previous) => !previous
                        )
                      }
                      aria-label={
                        showNewPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>


                {/* CONFIRM PASSWORD */}

                <div className="settings-input-group">

                  <label htmlFor="confirm-password">
                    Confirm new password
                  </label>

                  <div className="settings-input-wrapper">

                    <Lock size={17} />

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        passwordForm.confirmPassword
                      }
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="settings-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) => !previous
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

                {passwordError && (
  <div className="settings-modal-error">
    <X size={16} />
    <span>{passwordError}</span>
  </div>
)}


                <div className="settings-modal-actions">

                  <button
                    type="button"
                    className="settings-secondary-button"
                    onClick={closePasswordModal}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="settings-primary-button"
                    disabled={passwordLoading}
                  >
                    {passwordLoading
                      ? "Updating..."
                      : "Change Password"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </main>
    </Navbar1>
  );
}