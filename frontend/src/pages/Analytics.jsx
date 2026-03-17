import React, { useState, useEffect } from "react";
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
  const { summary, loading, fetchSummary, error } = useDashboard();
  const [data, setData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (summary?.sales_data) {
      setData(summary.sales_data);
    }
    if (summary?.top_products) {
      setTopProducts(summary.top_products);
    }
  }, [summary]);

  const stats = [
    { label: 'Total Sales Records', value: data.length, icon: '📊' },
    { label: 'Products Managed', value: summary?.total_products || 0, icon: '📦' },
    { label: 'Active Stores', value: summary?.total_stores || 0, icon: '🏪' },
    { label: 'Avg Forecast Accuracy', value: summary?.metrics_summary?.model_accuracy ? `${(summary.metrics_summary.model_accuracy * 100).toFixed(1)}%` : 'N/A', icon: '✨' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="pb-20">
        <section className="page-hero relative overflow-hidden bg-gradient-to-r from-primary/90 to-brand/90 py-12 md:py-20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="page-container relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider mb-4 border border-white/30">
                  Data Intelligence
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                  Analytics <span className="text-secondary-light">Engine</span>
                </h1>
                <p className="max-w-xl text-lg text-white/80 leading-relaxed font-medium">
                  Deep dive into your market behavior with our neural-demand mapping and behavioral analysis.
                </p>
              </div>
              <button 
                onClick={fetchSummary}
                className="group flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span className={`transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}>🔄</span>
                Refresh Insights
              </button>
            </div>
          </div>
        </section>

        <section className="page-container -mt-10 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((s, i) => (
              <div key={i} className="panel-card p-4 md:p-6 flex items-center gap-4 border-b-4 border-b-primary/50">
                <div className="text-2xl md:text-3xl bg-slate-100 dark:bg-slate-800 w-12 h-12 flex items-center justify-center rounded-xl shadow-inner">
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="panel-card p-24 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-300 animate-pulse">
                Synthesizing market data...
              </p>
            </div>
          ) : error ? (
            <div className="panel-card p-12 text-center border-red-200 dark:border-red-900/30">
               <div className="text-5xl mb-4">⚠️</div>
               <h3 className="text-2xl font-bold text-red-600 mb-2">Sync Error</h3>
               <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{error}</p>
            </div>
          ) : data.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="lg:col-span-2 flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold dark:text-white">Neural Patterns</h2>
                <span className="text-sm font-medium text-slate-500">Showing {data.length} data points</span>
              </div>
              
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
            <div className="panel-card p-12 md:p-20 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <div className="text-9xl font-black">?</div>
               </div>
               
               <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">
                  📭
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                  Analytics Database is Empty
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                  The engine is ready but it needs historical fuel. To activate these visualizations, you must upload your master data file.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left mb-10">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <span className="text-primary">👉</span> Instructions:
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span> 
                      Go to the <strong>Dashboard</strong> page.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span> 
                      Scroll to the <strong>Data Upload</strong> section.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span> 
                      Switch to <strong>⚙️ Train & Ingest</strong> mode.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span> 
                      Upload your CSV master file (ensure it has 'target_demand').
                    </li>
                  </ul>
                </div>
                
                <a 
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  Go to Dashboard to Upload
                  <span>🚀</span>
                </a>
               </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
