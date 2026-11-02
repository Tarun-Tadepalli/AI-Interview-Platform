import {BrowserRouter, Routes, Route, Navigate, } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Resume from "../pages/ResumeSetup";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import Terms from "../pages/Terms";
import Privacy from "../pages/Privacy";
import Interview from "../pages/Interview";
import SpeakingPractice from "../pages/Speaking";
import TypingPractice from "../pages/TypingPractice";
import Progress from "../pages/Progress";
import AskAI from "../pages/AskAI";

import ForgotPassword from "../pages/ForgotPassword";

import ProtectedRoute from "../components/ProtectedRoute";
import SessionManager from "../components/SessionManager";


function AppRoutes() {
  return (
    <BrowserRouter>

      {/* Automatic inactivity logout */}
      <SessionManager />

      <Routes>

        {/* =================================================
            PUBLIC PAGES
        ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =================================================
            PROTECTED PAGES
        ================================================= */}

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Resume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/terms"
          element={
            <ProtectedRoute>
              <Terms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <Privacy />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/speaking"
          element={
            <ProtectedRoute>
              <SpeakingPractice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/typing"
          element={
            <ProtectedRoute>
              <TypingPractice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ask-ai"
          element={
            <ProtectedRoute>
              <AskAI />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRoutes;