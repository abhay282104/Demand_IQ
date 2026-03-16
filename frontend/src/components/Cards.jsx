import React from 'react'
import { TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'

export const KPICard = ({ title, value, subtitle, icon: Icon, trend, darkMode }) => {
  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <h3 className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </h3>
          {subtitle && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.value >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp size={16} className="mr-1" />
              {trend.label}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
          }`}>
            <Icon size={24} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
          </div>
        )}
      </div>
    </div>
  )
}

export const StatusCard = ({ status, message, darkMode }) => {
  const isHealthy = status === 'healthy'
  
  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center space-x-3">
        {isHealthy ? (
          <CheckCircle className="text-green-500" size={32} />
        ) : (
          <AlertCircle className="text-yellow-500" size={32} />
        )}
        <div>
          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isHealthy ? 'System Healthy' : 'Degraded Mode'}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

export const MetricsCard = ({ metrics, darkMode }) => {
  if (!metrics) {
    return (
      <div className={`${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl p-6 shadow-lg`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading metrics...</p>
      </div>
    )
  }

  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl p-6 shadow-lg`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Model Performance
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            MAE (Mean Absolute Error)
          </span>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {metrics.mae?.toFixed(4) || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            RMSE (Root Mean Squared Error)
          </span>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {metrics.rmse?.toFixed(4) || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            R² Score (Model Accuracy)
          </span>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {metrics.r2_score?.toFixed(4) || 'N/A'}
          </span>
        </div>
        {metrics.training_samples && (
          <>
            <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />
            <div className="text-xs space-y-1">
              <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                Training samples: {metrics.training_samples.toLocaleString()}
              </p>
              <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                Test samples: {metrics.test_samples.toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
