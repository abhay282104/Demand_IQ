import "./index.css";
import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider, useToast } from "./hooks/useToast";
import { Toast } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Analytics = lazy(() =>
  import("./pages/Analytics").then((module) => ({ default: module.Analytics })),
);
const Login = lazy(() =>
  import("./pages/Login").then((module) => ({ default: module.Login })),
);
const Register = lazy(() =>
  import("./pages/Register").then((module) => ({ default: module.Register })),
);
const ForgotPassword = lazy(() =>
  import("./pages/ForgotPassword").then((module) => ({
    default: module.ForgotPassword,
  })),
);
const Profile = lazy(() =>
  import("./pages/Profile").then((module) => ({ default: module.Profile })),
);
const History = lazy(() =>
  import("./pages/History").then((module) => ({ default: module.History })),
);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("demandiq-theme");
    return savedTheme === "dark";
  });

  useEffect(() => {
    localStorage.setItem("demandiq-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent darkMode={darkMode} setDarkMode={setDarkMode} />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppContent({ darkMode, setDarkMode }) {
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="app-shell">
      <Router>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center px-4">
              <div className="panel-card w-full max-w-md text-center p-8">
                <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  Loading DemandIQ workspace...
                </p>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login darkMode={darkMode} />} />
            <Route
              path="/register"
              element={<Register darkMode={darkMode} />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics darkMode={darkMode} setDarkMode={setDarkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile darkMode={darkMode} setDarkMode={setDarkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History darkMode={darkMode} setDarkMode={setDarkMode} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
      <Toast toasts={toasts} removeToast={removeToast} darkMode={darkMode} />
    </div>
  );
}

export default App;
