import React, { useState } from "react";
import { Lock, Mail, Phone, Bell, Shield, LogOut, Trash2, ChevronRight, Check, UserRound, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import "../styles/settings.css";

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className={`settings-toggle ${checked ? "active" : ""}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    aria-label="Toggle setting"
  >
    <span />
  </button>
);

const SettingsRow = ({ icon: Icon, title, description, children, onClick, danger = false }) => (
  <div className={`settings-row ${danger ? "danger-row" : ""}`} onClick={onClick}>
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

export default function Settings() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    interviewReminders: true,
    practiceReminders: true,
    emailNotifications: false,
  });

  const [message, setMessage] = useState("");

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  return (
    <Navbar1>
      <main className="app-content settings-content">
        <div className="settings-page">

          <header className="settings-header">
            <span className="settings-eyebrow">
              <span />
              ACCOUNT SETTINGS
            </span>

            <h1>Settings</h1>

            <p>
              Manage your account, security, notifications and account preferences.
            </p>
          </header>

          {message && (
            <div className="settings-message">
              <Check size={17} />
              <span>{message}</span>
            </div>
          )}

          {/* ACCOUNT */}
          <section className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-section-icon">
                <UserRound size={20} />
              </div>

              <div>
                <span className="settings-section-eyebrow">ACCOUNT</span>
                <h2>Account Information</h2>
                <p>Manage the information connected to your account.</p>
              </div>
            </div>

            <div className="settings-card">
              <SettingsRow
                icon={Mail}
                title="Email Address"
                description="Your registered email address and account identifier."
                onClick={() => showMessage("Email changes will be available with account verification.")}
              />

              <SettingsRow
                icon={Phone}
                title="Phone Number"
                description="Manage the phone number connected to your account."
                onClick={() => showMessage("Phone number management will be available soon.")}
              />

              <SettingsRow
                icon={UserRound}
                title="Profile Information"
                description="View and manage your personal, education and interview information."
                onClick={() => navigate("/profile")}
              />
            </div>
          </section>

          {/* SECURITY */}
          <section className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-section-icon">
                <Shield size={20} />
              </div>

              <div>
                <span className="settings-section-eyebrow">SECURITY</span>
                <h2>Password & Authentication</h2>
                <p>Keep your account secure and manage authentication controls.</p>
              </div>
            </div>

            <div className="settings-card">
              <SettingsRow
                icon={Lock}
                title="Change Password"
                description="Update your password to keep your account protected."
                onClick={() => showMessage("Password change will be connected to the backend.")}
              />

              <SettingsRow
                icon={Shield}
                title="Manage Security"
                description="Review account security and authentication controls."
                onClick={() => showMessage("Security controls are ready for backend integration.")}
              />

            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-section-icon">
                <Bell size={20} />
              </div>

              <div>
                <span className="settings-section-eyebrow">PREFERENCES</span>
                <h2>Notifications</h2>
                <p>Choose which reminders and notifications you receive.</p>
              </div>
            </div>

            <div className="settings-card">
              <SettingsRow
                icon={Bell}
                title="Interview Reminders"
                description="Receive reminders about scheduled interview practice."
              >
                <Toggle
                  checked={notifications.interviewReminders}
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
                  checked={notifications.practiceReminders}
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
                  checked={notifications.emailNotifications}
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

          {/* DANGER ZONE */}
          <section className="settings-section">
            <div className="settings-section-heading danger-heading">
              <div className="settings-section-icon">
                <Shield size={20} />
              </div>

              <div>
                <span className="settings-section-eyebrow">ACCOUNT CONTROL</span>
                <h2>Danger Zone</h2>
                <p>Actions that affect your account access or account data.</p>
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
                title="Delete Account"
                description="Permanently delete your account and associated data."
                danger
                onClick={() =>
                  showMessage("Account deletion will require backend confirmation.")
                }
              />
            </div>
          </section>

          {/* LEGAL */}
          <section className="settings-section legal-section">
            <div className="legal-card">
              <div className="legal-card-info">
                <FileText size={19} />
                <div>
                  <h2>Terms & Privacy</h2>
                  <p>Review the documents related to using AI Interview Platform.</p>
                </div>
              </div>

              <div className="legal-links">
                <button onClick={() => navigate("/terms")}>
                  Terms & Conditions
                  <ChevronRight size={16} />
                </button>

                <button onClick={() => navigate("/privacy")}>
                  Privacy Policy
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <footer className="settings-footer">
            <span>AI Interview Training Platform</span>
            <span>Keep learning. Keep improving.</span>
          </footer>

        </div>
      </main>
    </Navbar1>
  );
}