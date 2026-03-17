import React, { useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { StatusCard } from "../components/Cards";
import { FileUpload } from "../components/FileUpload";
import { useDashboard } from "../hooks/useApi";

export const Dashboard = ({ darkMode, setDarkMode }) => {
  const { fetchSummary } = useDashboard();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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
          <div className="panel-card p-6 md:p-8">
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
