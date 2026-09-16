import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  LayoutDashboard,
  Mic2,
  Keyboard,
  BarChart3,
  User,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  UserRound,
  FileText,
  MessageCircle,
  BriefcaseBusiness,
} from "lucide-react";

import "../styles/navbar1.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Interview",
    path: "/interview",
    icon: BriefcaseBusiness,
  },
  {
    label: "Speaking Practice",
    path: "/speaking",
    icon: Mic2,
  },
  {
    label: "Typing Practice",
    path: "/typing",
    icon: Keyboard,
  },
  {
    label: "Progress",
    path: "/progress",
    icon: BarChart3,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
  },
  {
    label: "Ask AI",
    path: "/ask-ai",
    icon: MessageCircle,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function getCurrentUser() {
  try {
    const currentUser = localStorage.getItem("currentUser");

    if (currentUser) {
      return JSON.parse(currentUser);
    }

    const pendingRegistration =
      localStorage.getItem("pendingRegistration");

    if (pendingRegistration) {
      return JSON.parse(pendingRegistration);
    }
  } catch (error) {
    console.error("Unable to read user information:", error);
  }

  return {
    firstName: "User",
    lastName: "",
    email: "user@example.com",
  };
}

function Navbar1({ children }) {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser);

  const profileRef = useRef(null);

  useEffect(() => {
    const updateUser = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener("storage", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const firstName =
    user?.firstName || user?.first_name || "User";

  const lastName =
    user?.lastName || user?.last_name || "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");

    setProfileOpen(false);

    navigate("/login");
  };

  return (
    <div
      className={`app-shell ${
        sidebarOpen
          ? "sidebar-expanded"
          : "sidebar-collapsed"
      }`}
    >
      {/* =====================================================
          TOP NAVBAR
      ===================================================== */}

      <header className="app-topbar">
        <div className="topbar-left">

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() =>
              setSidebarOpen(
                (previous) => !previous
              )
            }
            aria-label={
              sidebarOpen
                ? "Collapse sidebar"
                : "Expand sidebar"
            }
          >
            {sidebarOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}
          </button>

          <div className="app-brand">
            <div className="app-brand-icon">
              <BrainCircuit size={24} />
            </div>

            <div className="app-brand-text">
              <span className="app-brand-title">
                AI Interview
              </span>

              <span className="app-brand-subtitle">
                Training Platform
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            PROFILE DROPDOWN
        ===================================================== */}

        <div
          className="profile-area"
          ref={profileRef}
        >
          <button
            type="button"
            className={`profile-trigger ${
              profileOpen
                ? "profile-trigger-active"
                : ""
            }`}
            onClick={() =>
              setProfileOpen(
                (previous) => !previous
              )
            }
            aria-expanded={profileOpen}
          >
            <div className="profile-avatar">
              {initials || (
                <UserRound size={20} />
              )}
            </div>

            <div className="profile-user-info">
              <span className="profile-user-name">
                {fullName}
              </span>

              <span className="profile-user-role">
                Interview Candidate
              </span>
            </div>

            <ChevronDown
              size={18}
              className={`profile-chevron ${
                profileOpen
                  ? "profile-chevron-open"
                  : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">

              <div className="dropdown-user">
                <div className="dropdown-avatar">
                  {initials || (
                    <UserRound size={20} />
                  )}
                </div>

                <div className="dropdown-user-details">
                  <strong>{fullName}</strong>

                  <span>
                    {user?.email ||
                      "user@example.com"}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
              >
                <UserRound size={17} />
                <span>Profile</span>
              </button>

              <button
                type="button"
                className="dropdown-item dropdown-logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>

            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          LEFT SIDEBAR
      ===================================================== */}

      <aside className="app-sidebar">
        <div className="sidebar-navigation">

          <div className="sidebar-section-label">
            <span>WORKSPACE</span>
          </div>

          <nav className="sidebar-menu">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive
                        ? "sidebar-link-active"
                        : ""
                    }`
                  }
                  title={
                    !sidebarOpen
                      ? item.label
                      : ""
                  }
                >
                  <span className="sidebar-link-icon">
                    <Icon size={20} />
                  </span>

                  <span className="sidebar-link-label">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

        </div>

        {/* =====================================================
            SIDEBAR BOTTOM CARD
        ===================================================== */}

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon">
            <FileText size={19} />
          </div>

          <div className="sidebar-help-text">
            <strong>Interview Ready?</strong>
            <span>
              Keep practicing every day.
            </span>
          </div>
        </div>
      </aside>

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      {children}

    </div>
  );
}

export default Navbar1;