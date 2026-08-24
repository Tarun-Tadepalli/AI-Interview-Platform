import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    api
      .get("/health")
      .then((response) => {
        setMessage(response.data.status);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Backend connection failed");
      });
  }, []);

  return (
    <div>
      <h1>AI Interview Training Platform</h1>

      <p>Backend Status: {message}</p>
    </div>
  );
}

export default App;