import React, { useEffect } from 'react'
import { BarChart3, TrendingUp, Store, Zap } from 'lucide-react'
// import { Sidebar } from '../components/Sidebar'
import { Navbar } from '../components/Navbar'
import { KPICard, StatusCard, MetricsCard } from '../components/Cards'
import { PredictionPanel } from '../components/PredictionPanel'
import { FileUpload } from '../components/FileUpload'
import { DemandTrendChart } from '../components/Charts'
import { useDashboard, usePrediction } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'

export const Dashboard = ({ darkMode, setDarkMode }) => {
  const { summary, loading: dashboardLoading, fetchSummary } = useDashboard()
  const { makePrediction, loading: predictionLoading } = usePrediction()
  const { showToast } = useToast()

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handlePrediction = async (data) => {
    const result = await makePrediction(data)
    return result
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <div>
        
        
        <main>
          {/* Hero Header */}
          <div className="bg-gradient-header text-white p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Demand Intelligence Dashboard
            </h1>
            <p className="text-blue-100 text-lg">
              AI-powered demand forecasting and pricing intelligence
            </p>
          </div>

          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard
                title="Historical Demand"
                value={summary?.metrics_summary?.total_historical_demand || 0}
                icon={TrendingUp}
                darkMode={darkMode}
              />
              <KPICard
                title="Predicted Demand"
                value={summary?.metrics_summary?.predicted_demand || 0}
                icon={BarChart3}
                darkMode={darkMode}
              />
              <KPICard
                title="Average Price"
                value={`$${(summary?.metrics_summary?.average_price || 0).toFixed(2)}`}
                icon={Store}
                darkMode={darkMode}
              />
              <KPICard
                title="Model Accuracy"
                value={`${((summary?.metrics_summary?.model_accuracy || 0) * 100).toFixed(1)}%`}
                icon={Zap}
                darkMode={darkMode}
              />
            </div>
            {/* Top products by demand */}
            {summary?.top_products && summary.top_products.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Top Products by Demand
                </h2>
                <div className="overflow-x-auto">
                  <table className={`min-w-full border ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <th className="px-4 py-2 text-left">Product ID</th>
                        <th className="px-4 py-2 text-right">Total Demand</th>
                        <th className="px-4 py-2 text-right">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.top_products.map(p => (
                        <tr key={p.product_id} className={`${darkMode ? 'border-gray-600' : 'border-gray-200'} border-t`}>
                          <td className="px-4 py-2">{p.product_id}</td>
                          <td className="px-4 py-2 text-right">{p.total_demand.toFixed(0)}</td>
                          <td className="px-4 py-2 text-right">${p.avg_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Charts */}
              <div className="lg:col-span-2">
                <DemandTrendChart
                  data={summary?.sales_data || []}
                  darkMode={darkMode}
                />
              </div>

              {/* Metrics Card */}
              <div>
                <MetricsCard
                  metrics={summary?.model_metrics}
                  darkMode={darkMode}
                />
              </div>
            </div>


            {/* Prediction Panel */}
            <div className="mb-8">
              <PredictionPanel
                onPrediction={handlePrediction}
                loading={predictionLoading}
                darkMode={darkMode}
              />
            </div>

            {/* File Upload Section */}
            <div className={`${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl p-8 shadow-lg mb-8`}>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Data Upload & Batch Operations
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload a CSV file to run predictions and analysis on your data. The file must follow the expected schema.
              </p>
              <FileUpload darkMode={darkMode} />
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <StatusCard
                status="healthy"
                message="All systems operational"
                darkMode={darkMode}
              />
              <div className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl p-6 shadow-lg`}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  System Statistics
                </h3>
                <div className="space-y-2">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Products: <span className="font-semibold">{summary?.total_products || 0}</span>
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Stores: <span className="font-semibold">{summary?.total_stores || 0}</span>
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Predictions: <span className="font-semibold">{summary?.total_predictions || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
