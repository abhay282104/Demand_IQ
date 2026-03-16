import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Moon,
  Sun,
  Activity,
  LayoutDashboard,
  BarChart3,
  History,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar = ({ darkMode, setDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkBase =
    "inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-colors";
  const linkDesktop = ({ isActive }) =>
    `${linkBase} ${
      isActive
        ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/60"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-700 shadow-sm">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              DemandIQ
            </span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <NavLink to="/" className={linkDesktop}>
              <LayoutDashboard size={15} />
              Dashboard
            </NavLink>
            <NavLink to="/analytics" className={linkDesktop}>
              <BarChart3 size={15} />
              Analytics
            </NavLink>
            <NavLink to="/history" className={linkDesktop}>
              <History size={15} />
              History
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User dropdown */}
            {user && (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-700 text-white text-xs font-bold select-none">
                    {(user.full_name || user.username || "?")[0].toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User size={14} /> Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/history");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      <History size={14} /> History
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="animate-slide-down border-t border-slate-200 py-3 md:hidden dark:border-slate-700">
            <div className="flex flex-col gap-1">
              <NavLink
                to="/"
                className={linkDesktop}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </NavLink>
              <NavLink
                to="/analytics"
                className={linkDesktop}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 size={15} />
                Analytics
              </NavLink>
              <NavLink
                to="/history"
                className={linkDesktop}
                onClick={() => setMobileMenuOpen(false)}
              >
                <History size={15} />
                History
              </NavLink>
              <NavLink
                to="/profile"
                className={linkDesktop}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={15} />
                Profile
              </NavLink>
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className={`${linkBase} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 w-full text-left`}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
