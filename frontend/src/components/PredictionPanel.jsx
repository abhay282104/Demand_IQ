import React, { useState } from 'react'
import { Zap, Loader } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export const PredictionPanel = ({ onPrediction, loading, darkMode }) => {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    product_id: 1043,
    store_id: 9,
    price: 48.29,
    promotion_flag: 0,
    holiday_flag: 0,
    economic_index: 84.07,
  })

  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : parseInt(value),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await onPrediction(formData)
      if (response) {
        setResult(response)
        showToast('Prediction successful!', 'success')
      } else {
        showToast('Prediction failed. Please try again.', 'error')
      }
    } catch (error) {
      showToast(error.message || 'An error occurred', 'error')
    }
  }

  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl p-8 shadow-lg`}>
      <div className="flex items-center space-x-2 mb-6">
        <Zap className={darkMode ? 'text-yellow-400' : 'text-blue-600'} size={24} />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Make a Prediction
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product ID */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Product ID
            </label>
            <input
              type="number"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Store ID */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Store ID
            </label>
            <input
              type="number"
              name="store_id"
              value={formData.store_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Price */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Price ($)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Economic Index */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Economic Index
            </label>
            <input
              type="number"
              name="economic_index"
              value={formData.economic_index}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col md:flex-row gap-6">
          <label className={`flex items-center space-x-3 cursor-pointer ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <input
              type="checkbox"
              name="promotion_flag"
              checked={formData.promotion_flag === 1}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                promotion_flag: e.target.checked ? 1 : 0
              }))}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium">Active Promotion</span>
          </label>

          <label className={`flex items-center space-x-3 cursor-pointer ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <input
              type="checkbox"
              name="holiday_flag"
              checked={formData.holiday_flag === 1}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                holiday_flag: e.target.checked ? 1 : 0
              }))}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium">Holiday Period</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading && <Loader size={20} className="animate-spin" />}
          <span>{loading ? 'Predicting...' : 'Predict Demand'}</span>
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`mt-8 p-6 rounded-xl ${
          darkMode ? 'bg-gray-700' : 'bg-blue-50'
        } border-l-4 border-blue-500`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Prediction Result
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-700'}>
                Predicted Demand:
              </span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {result.predicted_demand}
              </span>
            </div>
            <div className={`p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {result.confidence_info}
              </span>
            </div>
            {result.model_metrics && (
              <div className={`p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  Model Metrics (R²: {result.model_metrics.r2?.toFixed(4)})
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
