import React from "react";

export const Toast = ({ toasts, removeToast, darkMode }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 px-2 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-in max-w-xs rounded-xl border p-4 shadow-lg ${
            toast.type === "success"
              ? darkMode
                ? "border-green-700 bg-green-900 text-green-200"
                : "border-green-300 bg-green-50 text-green-800"
              : toast.type === "error"
                ? darkMode
                  ? "border-red-700 bg-red-900 text-red-200"
                  : "border-red-300 bg-red-50 text-red-800"
                : darkMode
                  ? "border-blue-700 bg-blue-900 text-blue-200"
                  : "border-blue-300 bg-blue-50 text-blue-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
