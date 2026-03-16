import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const DemandTrendChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className="panel-soft flex h-80 w-full items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300">No data available</p>
      </div>
    );
  }

  return (
    <div className="panel-card w-full p-5 md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Demand Trend
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#1f2937" : "#ffffff",
              border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
              color: darkMode ? "#f3f4f6" : "#111827",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="target_demand"
            stroke="#3b82f6"
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
            name="Actual Demand"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PriceVsDemandChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className="panel-soft flex h-80 w-full items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300">No data available</p>
      </div>
    );
  }

  return (
    <div className="panel-card w-full p-5 md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Price vs Demand
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="price"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            name="Price"
          />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} name="Demand" />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#1f2937" : "#ffffff",
              border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
              color: darkMode ? "#f3f4f6" : "#111827",
            }}
          />
          <Scatter name="Price-Demand" data={data} fill="#6366f1" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
