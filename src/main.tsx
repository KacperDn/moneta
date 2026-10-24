import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./i18n";
import App from "./App";
import PasswordReset from "./PasswordReset";
import ErrorBoundary from "./ErrorBoundary";
import "./styles/main.scss";

const params = new URLSearchParams(window.location.search);
const isRecovery = params.get("type") === "recovery" && !!params.get("token");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {isRecovery ? <PasswordReset /> : <App />}
    </ErrorBoundary>
    <Toaster
      position="bottom-center"
      containerStyle={{ bottom: 88 }}
      toastOptions={{
        style: {
          background: "#1c1c1f",
          color: "#fafafa",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "var(--accent)", secondary: "var(--bg)" } },
        error:   { iconTheme: { primary: "var(--danger)", secondary: "var(--bg)" } },
      }}
    />
  </StrictMode>
);