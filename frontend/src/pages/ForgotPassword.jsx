import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Loader, ArrowLeft, CheckCircle } from "lucide-react";
import { apiService } from "../services/api";

export const ForgotPassword = () => {
  const [step, setStep] = useState("request"); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const handleRequest = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Enter a valid email" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.forgotPassword({ email });
      setServerMessage(res.data.message);
      // If reset_token is returned (dev mode), prefill it
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token);
      }
      setStep("reset");
    } catch (err) {
      setServerError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    const errs = {};
    if (!resetToken.trim()) errs.resetToken = "Reset token is required";
    if (!newPassword) errs.newPassword = "Password is required";
    else if (newPassword.length < 8) errs.newPassword = "Minimum 8 characters";
    if (newPassword !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await apiService.resetPassword({
        token: resetToken,
        new_password: newPassword,
      });
      setStep("done");
    } catch (err) {
      setServerError(
        err.response?.data?.detail || "Reset failed. Token may be expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-700 shadow-lg mb-3">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {step === "done" ? "Password Reset!" : "Forgot Password"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === "request" && "We'll get you back in"}
            {step === "reset" && "Enter your reset token and new password"}
            {step === "done" && "Your password has been updated"}
          </p>
        </div>

        <div className="panel-card p-8">
          {step === "done" ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto text-teal-500" size={48} />
              <p className="text-slate-600 dark:text-slate-300">
                Password reset successfully. You can now sign in with your new
                password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:from-teal-500 hover:to-sky-500 transition-all"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {serverError}
                </div>
              )}
              {serverMessage && step === "reset" && (
                <div className="mb-4 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-700 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-400">
                  {serverMessage}
                </div>
              )}

              {step === "request" ? (
                <form onSubmit={handleRequest} className="space-y-5" noValidate>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({});
                      }}
                      placeholder="you@example.com"
                      className={`form-input ${errors.email ? "border-red-400" : ""}`}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-teal-500 hover:to-sky-500 disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <Loader size={16} className="animate-spin" />
                    ) : null}
                    {loading ? "Sending…" : "Send Reset Token"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="space-y-4" noValidate>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => {
                        setResetToken(e.target.value);
                        setErrors({});
                      }}
                      placeholder="Paste reset token here"
                      className={`form-input font-mono text-xs ${errors.resetToken ? "border-red-400" : ""}`}
                    />
                    {errors.resetToken && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.resetToken}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrors({});
                      }}
                      placeholder="Min. 8 characters"
                      className={`form-input ${errors.newPassword ? "border-red-400" : ""}`}
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({});
                      }}
                      placeholder="Re-enter new password"
                      className={`form-input ${errors.confirmPassword ? "border-red-400" : ""}`}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-teal-500 hover:to-sky-500 disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <Loader size={16} className="animate-spin" />
                    ) : null}
                    {loading ? "Resetting…" : "Reset Password"}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
