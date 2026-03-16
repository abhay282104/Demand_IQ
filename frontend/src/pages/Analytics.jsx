import React, { useState, useEffect } from 'react'
// import { Sidebar } from '../components/Sidebar'
import { Navbar } from '../components/Navbar'
import {
  DemandDistributionChart,
  PriceDistributionChart,
  CategoryPerformanceChart,
  StorePerformanceChart,
  ProductPerformanceChart,
  PriceElasticityChart,
  HolidayImpactChart,
  EconomicIndexChart,
  ConfidenceDistributionChart,
} from '../components/AnalyticsCharts'
import { useDashboard } from '../hooks/useApi'

export const Analytics = ({ darkMode, setDarkMode }) => {
  const { summary, loading, fetchSummary } = useDashboard()
  const [data, setData] = useState([])
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    // Load analytics data from API response
    if (summary?.sales_data) {
      setData(summary.sales_data)
    }
    if (summary?.top_products) {
      setTopProducts(summary.top_products)
    }
  }, [summary])

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <div >
        

        <main >
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-purple-100 text-lg">
              Comprehensive data analysis and visualizations
            </p>
          </div>

          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {loading ? (
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-2xl p-12 text-center shadow-lg`}
              >
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Loading analytics data...
                </p>
              </div>
            ) : data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Row 1: Distribution Charts */}
                <DemandDistributionChart data={data} darkMode={darkMode} />
                <PriceDistributionChart data={data} darkMode={darkMode} />

                {/* Row 2: Performance Charts */}
                <CategoryPerformanceChart data={data} darkMode={darkMode} />
                <StorePerformanceChart data={data} darkMode={darkMode} />

                {/* Row 3: Product & Price (Top 10 demand) */}
                <div className="lg:col-span-2">
                  <ProductPerformanceChart
                    data={data}
                    topProducts={topProducts}
                    darkMode={darkMode}
                  />
                </div>

                {/* Row 4: Elasticity */}
                <div className="lg:col-span-2">
                  <PriceElasticityChart data={data} darkMode={darkMode} />
                </div>

                {/* Row 5: Impact Analysis */}
                <HolidayImpactChart data={data} darkMode={darkMode} />

                {/* Row 6: External Factors */}
                <div className="lg:col-span-2">
                  <EconomicIndexChart data={data} darkMode={darkMode} />
                </div>

                {/* Row 7: Confidence */}
                <div className="lg:col-span-2">
                  <ConfidenceDistributionChart data={data} darkMode={darkMode} />
                </div>
              </div>
            ) : (
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-2xl p-12 text-center shadow-lg`}
              >
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  No data available for analytics. Upload CSV data to see visualizations.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
