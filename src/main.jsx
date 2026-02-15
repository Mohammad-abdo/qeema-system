import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SystemSettingsProvider } from "./context/SystemSettingsContext";
import "./i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SystemSettingsProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </SystemSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
