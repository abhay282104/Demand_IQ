import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'

export const Navbar = ({ darkMode, setDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className={`${
      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    } border-b sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              DemandIQ
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm font-medium ${
              darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            }`}>
              Dashboard
            </Link>

            <Link to="/analytics" className={`text-sm font-medium ${
              darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            }`}>
              Analytics
            </Link>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${
              darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'
            } hover:scale-110 transition-transform`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className={darkMode ? 'text-white' : 'text-gray-900'} size={24} />
            ) : (
              <Menu className={darkMode ? 'text-white' : 'text-gray-900'} size={24} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-4 space-y-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <Link to="/" className={`block px-4 py-2 rounded ${
              darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'
            }`}>
              Dashboard
            </Link>

            <Link to="/analytics" className={`block px-4 py-2 rounded ${
              darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'
            }`}>
              Analytics
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}