import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { User, Save, Loader, CheckCircle } from "lucide-react";

export const Profile = ({ darkMode, setDarkMode }) => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    else if (form.username.length < 3) e.username = "Minimum 3 characters";
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setServerError("");
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.updateProfile(form);
      updateUser(res.data);
      setSaved(true);
    } catch (err) {
      setServerError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="page-container py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
            <User size={20} className="text-teal-600 dark:text-teal-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your account details
            </p>
          </div>
        </div>

        <div className="panel-card p-8">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-700 text-white text-2xl font-bold select-none">
              {(user?.full_name || user?.username || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {user?.full_name || user?.username}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {serverError}
            </div>
          )}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-700 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-400">
              <CheckCircle size={16} /> Profile updated successfully
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="form-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="janedoe"
                  className={`form-input ${errors.username ? "border-red-400" : ""}`}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="form-input opacity-60 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:from-teal-500 hover:to-sky-500 disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
