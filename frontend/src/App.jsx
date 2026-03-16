import './index.css'
import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastProvider, useToast } from './hooks/useToast'
import { Toast } from './components/Toast'
import { Dashboard } from './pages/Dashboard'
import { Analytics } from './pages/Analytics'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <ToastProvider>
      <AppContent darkMode={darkMode} setDarkMode={setDarkMode} />
    </ToastProvider>
  )
}

function AppContent({ darkMode, setDarkMode }) {
  const { toasts, removeToast } = useToast()

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/analytics" element={<Analytics darkMode={darkMode} setDarkMode={setDarkMode} />} />
        </Routes>
      </Router>
      <Toast toasts={toasts} removeToast={removeToast} darkMode={darkMode} />
    </div>
  )
}

export default App
