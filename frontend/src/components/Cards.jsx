import React from "react";
import { TrendingUp, AlertCircle, CheckCircle, Zap } from "lucide-react";

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  darkMode,
}) => {
  return (
    <div className="panel-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {typeof value === "number" ? value.toFixed(2) : value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend.value >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp size={16} className="mr-1" />
              {trend.label}
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            <Icon size={23} />
          </div>
        )}
      </div>
    </div>
  );
};

export const StatusCard = ({ status, message, darkMode }) => {
  const isHealthy = status === "healthy";

  return (
    <div className="panel-card p-6">
      <div className="flex items-center space-x-3">
        {isHealthy ? (
          <CheckCircle className="text-green-500" size={32} />
        ) : (
          <AlertCircle className="text-yellow-500" size={32} />
        )}
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {isHealthy ? "System Healthy" : "Degraded Mode"}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export const MetricsCard = ({ metrics, darkMode }) => {
  if (!metrics) {
    return (
      <div className="panel-card p-6">
        <p className="text-slate-600 dark:text-slate-300">Loading metrics...</p>
      </div>
    );
  }

  return (
    <div className="panel-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Model Performance
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            MAE (Mean Absolute Error)
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {metrics.mae?.toFixed(4) || "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            RMSE (Root Mean Squared Error)
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {metrics.rmse?.toFixed(4) || "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            R² Score (Model Accuracy)
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {metrics.r2_score?.toFixed(4) || "N/A"}
          </span>
        </div>
        {metrics.training_samples && (
          <>
            <hr className="border-slate-200 dark:border-slate-700" />
            <div className="text-xs space-y-1">
              <p className="text-slate-500 dark:text-slate-400">
                Training samples: {metrics.training_samples.toLocaleString()}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Test samples: {metrics.test_samples.toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
