import { useEffect } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { logoutUser } from "../services/authService";


const IDLE_TIMEOUT = 2 * 60 * 1000;


export default function SessionManager() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const publicPages = [
      "/",
      "/login",
      "/register",
    ];

    // Do nothing on public pages.
    if (publicPages.includes(location.pathname)) {
      return;
    }

    const token = localStorage.getItem("access_token");

    // Do nothing if user is not logged in.
    if (!token) {
      return;
    }

    let timeoutId;


    const logoutBecauseOfInactivity = () => {
      logoutUser();

      navigate("/login", {
        replace: true,
        state: {
          message:
            "You were logged out because of inactivity.",
        },
      });
    };


    const resetTimer = () => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(
        logoutBecauseOfInactivity,
        IDLE_TIMEOUT
      );
    };


    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];


    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });


    resetTimer();


    return () => {
      clearTimeout(timeoutId);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };

  }, [navigate, location.pathname]);


  return null;
}