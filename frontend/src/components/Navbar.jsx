import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";

export default function Navbar({ showHome = true }) {
  return (
    <header className="auth-navbar">

      {/* LEFT SIDE — WEBSITE BRAND */}
      <Link
        to="/"
        className="auth-navbar-brand"
      >
        <span className="auth-navbar-icon">
          <BrainCircuit size={25} />
        </span>

        <span>
          AI <strong>Interview</strong>
        </span>
      </Link>


      {/* RIGHT SIDE — HOME BUTTON */}
      {showHome && (
        <Link
          to="/"
          className="auth-home-link"
        >
          Home
        </Link>
      )}

    </header>
  );
}