import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getCurrentUser } from "../services/authService";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuthentication = async () => {
      const token = localStorage.getItem("access_token");

      // No token means the user is not logged in.
      if (!token) {
        if (mounted) {
          setAuthenticated(false);
          setChecking(false);
        }

        return;
      }

      try {
        const response = await getCurrentUser();

        /*
          The backend has already verified the JWT
          if /auth/me returns successfully.

          Do not require a specific "success" property here.
        */

        if (mounted) {
          setAuthenticated(true);

          if (response?.user) {
            localStorage.setItem(
              "currentUser",
              JSON.stringify(response.user)
            );
          } else if (response) {
            localStorage.setItem(
              "currentUser",
              JSON.stringify(response)
            );
          }
        }
      } catch (error) {
        /*
          Only remove authentication information
          when the backend request actually fails.
        */

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return null;
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}