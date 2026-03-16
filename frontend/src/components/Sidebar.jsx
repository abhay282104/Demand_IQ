import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export const Sidebar = ({ darkMode }) => {
  const location = useLocation()

  return (
    <aside className={`hidden md:flex md:flex-col w-64 ${
      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
    } border-r`}>

      <div className="flex-1 overflow-y-auto">
        {/* Navigation */}
        <nav className="px-4 py-8 space-y-2">
          <NavLink 
            to="/" 
            label="Dashboard" 
            active={location.pathname === '/'} 
            darkMode={darkMode} 
          />
          <NavLink 
            to="/analytics" 
            label="Analytics" 
            active={location.pathname === '/analytics'} 
            darkMode={darkMode} 
          />
          <NavLink 
            to="#" 
            label="Predictions" 
            darkMode={darkMode} 
          />
        </nav>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${
        darkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-100'
      }`}>
        <p className={`text-xs ${
          darkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          © 2024 DemandIQ v1.0.0
        </p>
      </div>

    </aside>
  )
}

function NavLink({ to, label, active = false, darkMode }) {
  if (to === '#') {
    return (
      <a
        href={to}
        className={`block px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
          darkMode
            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        {label}
      </a>
    )
  }

  return (
    <Link
      to={to}
      className={`block px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
        active
          ? darkMode
            ? 'bg-indigo-900 text-indigo-200'
            : 'bg-blue-100 text-blue-700'
          : darkMode
            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
            : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </Link>
  )
}