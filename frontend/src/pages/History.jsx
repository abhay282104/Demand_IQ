import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { apiService } from "../services/api";
import {
  History as HistoryIcon,
  Loader,
  TrendingUp,
  Tag,
  DollarSign,
} from "lucide-react";

export const History = ({ darkMode, setDarkMode }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiService
      .getHistory()
      .then((res) => setItems(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Failed to load history"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="page-container py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
            <HistoryIcon
              size={20}
              className="text-teal-600 dark:text-teal-300"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Prediction History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your recent demand predictions
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader size={28} className="animate-spin text-teal-500" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="panel-card p-10 text-center text-slate-500 dark:text-slate-400">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No predictions yet</p>
            <p className="text-sm mt-1">
              Make your first prediction from the Dashboard.
            </p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="panel-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                      <TrendingUp
                        size={18}
                        className="text-teal-600 dark:text-teal-400"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <Tag size={11} /> Product #{item.product_id}
                        </span>
                        <span>·</span>
                        <span>Store #{item.store_id}</span>
                        {item.input_promotion && (
                          <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 dark:bg-amber-900/30 dark:text-amber-400">
                            Promo
                          </span>
                        )}
                        {item.input_holiday && (
                          <span className="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 dark:bg-sky-900/30 dark:text-sky-400">
                            Holiday
                          </span>
                        )}
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        Predicted Demand:{" "}
                        <span className="text-teal-600 dark:text-teal-400">
                          {item.predicted_demand.toFixed(2)}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign size={11} /> Price: $
                          {item.input_price.toFixed(2)}
                        </span>
                        <span>
                          Economic Index: {item.input_economic_index.toFixed(2)}
                        </span>
                        <span>
                          Confidence: {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {item.model_version && (
                      <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">
                        v{item.model_version}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
