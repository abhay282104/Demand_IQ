import React, { useState, useEffect } from "react";
// import { Sidebar } from '../components/Sidebar'
import { Navbar } from "../components/Navbar";
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
} from "../components/AnalyticsCharts";
import { useDashboard } from "../hooks/useApi";

export const Analytics = ({ darkMode, setDarkMode }) => {
  const { summary, loading, fetchSummary } = useDashboard();
  const [data, setData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    // Load analytics data from API response
    if (summary?.sales_data) {
      setData(summary.sales_data);
    }
    if (summary?.top_products) {
      setTopProducts(summary.top_products);
    }
  }, [summary]);

  return (
    <div className="min-h-screen">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="pb-10">
        <section className="page-hero">
          <div className="page-container py-10 md:py-14">
            <p className="stat-pill mb-4">Advanced decision support</p>
            <h1 className="mb-2 text-3xl font-bold md:text-5xl">
              Analytics Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-white/85 md:text-base">
              Comprehensive data analysis and visualizations
            </p>
          </div>
        </section>

        <section className="page-container py-8">
          {loading ? (
            <div className="panel-card p-12 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                Loading analytics data...
              </p>
            </div>
          ) : data.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <DemandDistributionChart data={data} darkMode={darkMode} />
              <PriceDistributionChart data={data} darkMode={darkMode} />

              <CategoryPerformanceChart data={data} darkMode={darkMode} />
              <StorePerformanceChart data={data} darkMode={darkMode} />

              <div className="lg:col-span-2">
                <ProductPerformanceChart
                  data={data}
                  topProducts={topProducts}
                  darkMode={darkMode}
                />
              </div>

              <div className="lg:col-span-2">
                <PriceElasticityChart data={data} darkMode={darkMode} />
              </div>

              <HolidayImpactChart data={data} darkMode={darkMode} />

              <div className="lg:col-span-2">
                <EconomicIndexChart data={data} darkMode={darkMode} />
              </div>

              <div className="lg:col-span-2">
                <ConfidenceDistributionChart data={data} darkMode={darkMode} />
              </div>
            </div>
          ) : (
            <div className="panel-card p-12 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                No data available for analytics. Upload CSV data to see
                visualizations.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
