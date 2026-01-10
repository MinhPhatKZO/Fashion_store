import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.error("❌ Missing REACT_APP_GOOGLE_CLIENT_ID");
}

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <GoogleOAuthProvider clientId={clientId!}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
