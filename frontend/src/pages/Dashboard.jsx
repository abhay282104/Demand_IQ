import React, { useEffect } from "react";
import { BarChart3, TrendingUp, Store, Zap } from "lucide-react";
// import { Sidebar } from '../components/Sidebar'
import { Navbar } from "../components/Navbar";
import { KPICard, StatusCard, MetricsCard } from "../components/Cards";
import { PredictionPanel } from "../components/PredictionPanel";
import { FileUpload } from "../components/FileUpload";
import { DemandTrendChart } from "../components/Charts";
import { useDashboard, usePrediction } from "../hooks/useApi";

export const Dashboard = ({ darkMode, setDarkMode }) => {
  const { summary, fetchSummary } = useDashboard();
  const { makePrediction, loading: predictionLoading } = usePrediction();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePrediction = async (data) => {
    const result = await makePrediction(data);
    return result;
  };

  return (
    <div className="min-h-screen">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="pb-10">
        <section className="page-hero">
          <div className="page-container py-10 md:py-14">
            <p className="stat-pill mb-4">Real-time demand operations</p>
            <h1 className="mb-3 text-3xl font-bold md:text-5xl">
              Demand Intelligence Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-white/85 md:text-base">
              Monitor sales behavior, forecast demand, and evaluate model
              quality in one production-ready workspace.
            </p>
          </div>
        </section>

        <section className="page-container -mt-2 py-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
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

          {summary?.top_products && summary.top_products.length > 0 && (
            <div className="panel-card mt-8 overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Top Products by Demand
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-700 dark:text-slate-200">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80">
                      <th className="px-6 py-3 text-left">Product ID</th>
                      <th className="px-6 py-3 text-right">Total Demand</th>
                      <th className="px-6 py-3 text-right">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.top_products.map((p) => (
                      <tr
                        key={p.product_id}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="px-6 py-3">{p.product_id}</td>
                        <td className="px-6 py-3 text-right">
                          {p.total_demand.toFixed(0)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          ${p.avg_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DemandTrendChart
                data={summary?.sales_data || []}
                darkMode={darkMode}
              />
            </div>

            <div>
              <MetricsCard
                metrics={summary?.model_metrics}
                darkMode={darkMode}
              />
            </div>
          </div>

          <div className="mt-8">
            <PredictionPanel
              onPrediction={handlePrediction}
              loading={predictionLoading}
              darkMode={darkMode}
            />
          </div>

          <div className="panel-card mt-8 p-6 md:p-8">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Data Upload & Batch Operations
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              Upload a CSV file to run predictions and analysis on your data.
              The file must follow the expected schema.
            </p>
            <FileUpload darkMode={darkMode} />
          </div>

          <div className="mt-8">
            <StatusCard
              status="healthy"
              message="All systems operational"
              darkMode={darkMode}
            />
          </div>
        </section>
      </main>
    </div>
  );
};
