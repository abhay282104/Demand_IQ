import React from 'react'

export const Toast = ({ toasts, removeToast, darkMode }) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg animate-pulse ${
            toast.type === 'success'
              ? darkMode
                ? 'bg-green-900 text-green-200'
                : 'bg-green-100 text-green-800'
              : toast.type === 'error'
                ? darkMode
                  ? 'bg-red-900 text-red-200'
                  : 'bg-red-100 text-red-800'
                : darkMode
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
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
  )
}
