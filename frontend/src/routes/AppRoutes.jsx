import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/resume" element={<Resume />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="/terms" element={<Terms />} />

        <Route path="/privacy" element={<Privacy />} />

        <Route path="/interview" element={<Interview />} />

        <Route path="/speaking" element={<SpeakingPractice />} />

        <Route path="/typing" element={<TypingPractice />} />

        <Route path="/progress" element={<Progress />} />

        <Route path="/ask-ai" element={<AskAI />} />
        

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;