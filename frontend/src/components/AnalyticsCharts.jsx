import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

// Distribution Charts
export const DemandDistributionChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const min = Math.min(
    ...data.map((d) => d.predicted_demand || d.target_demand || 0),
  );
  const max = Math.max(
    ...data.map((d) => d.predicted_demand || d.target_demand || 0),
  );
  const range = (max - min) / 10;
  const bins = Array(10)
    .fill(0)
    .map((_, i) => ({
      range: `${(min + i * range).toFixed(0)}-${(min + (i + 1) * range).toFixed(0)}`,
      count: 0,
    }));

  data.forEach((d) => {
    const value = d.predicted_demand || d.target_demand || 0;
    const binIndex = Math.min(Math.floor((value - min) / range), 9);
    bins[binIndex].count++;
  });

  return (
    <ChartContainer title="Demand Distribution" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="range"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const PriceDistributionChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const prices = data.filter((d) => d.price !== undefined);
  if (prices.length === 0) return <EmptyChart darkMode={darkMode} />;

  const min = Math.min(...prices.map((p) => p.price));
  const max = Math.max(...prices.map((p) => p.price));
  const range = (max - min) / 10;
  const bins = Array(10)
    .fill(0)
    .map((_, i) => ({
      range: `$${(min + i * range).toFixed(2)}-$${(min + (i + 1) * range).toFixed(2)}`,
      count: 0,
    }));

  prices.forEach((p) => {
    const binIndex = Math.min(Math.floor((p.price - min) / range), 9);
    bins[binIndex].count++;
  });

  return (
    <ChartContainer title="Price Distribution" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="range"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Category Performance
export const CategoryPerformanceChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const categoryMap = {};
  data.forEach((d) => {
    const catId = d.category_id || "Unknown";
    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        category: `Category ${catId}`,
        avgDemand: 0,
        avgPrice: 0,
        count: 0,
      };
    }
    categoryMap[catId].avgDemand += d.predicted_demand || d.target_demand || 0;
    categoryMap[catId].avgPrice += d.price || 0;
    categoryMap[catId].count++;
  });

  const chartData = Object.values(categoryMap).map((cat) => ({
    ...cat,
    avgDemand: parseFloat((cat.avgDemand / cat.count).toFixed(2)),
    avgPrice: parseFloat((cat.avgPrice / cat.count).toFixed(2)),
  }));

  return (
    <ChartContainer title="Category Performance" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis dataKey="category" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Legend />
          <Bar
            dataKey="avgDemand"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            name="Avg Demand"
          />
          <Bar
            dataKey="avgPrice"
            fill="#f59e0b"
            radius={[8, 8, 0, 0]}
            name="Avg Price"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Store Performance
export const StorePerformanceChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const storeMap = {};
  data.forEach((d) => {
    const storeId = d.store_id || "Unknown";
    if (!storeMap[storeId]) {
      storeMap[storeId] = {
        store: `Store ${storeId}`,
        revenue: 0,
        demand: 0,
        count: 0,
      };
    }
    const demand = d.predicted_demand || d.target_demand || 0;
    const price = d.price || 0;
    storeMap[storeId].revenue += demand * price;
    storeMap[storeId].demand += demand;
    storeMap[storeId].count++;
  });

  const chartData = Object.values(storeMap)
    .map((store) => ({
      ...store,
      avgRevenue: parseFloat((store.revenue / store.count).toFixed(2)),
      avgDemand: parseFloat((store.demand / store.count).toFixed(2)),
    }))
    .sort((a, b) => b.avgRevenue - a.avgRevenue)
    .slice(0, 10);

  return (
    <ChartContainer title="Top 10 Store Performance" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="store"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Legend />
          <Bar
            dataKey="avgRevenue"
            fill="#10b981"
            radius={[8, 8, 0, 0]}
            name="Avg Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Product Performance
export const ProductPerformanceChart = ({ data, topProducts, darkMode }) => {
  // If backend provided explicit topProducts list, use it directly
  if (topProducts && topProducts.length > 0) {
    const chartData = topProducts.map((p) => ({
      product: `Product ${p.product_id}`,
      demand: p.total_demand,
      price: p.avg_price,
      confidence: 0.7,
    }));

    return (
      <ChartContainer title="Top 10 Products by Demand" darkMode={darkMode}>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              type="number"
              dataKey="price"
              stroke={darkMode ? "#9ca3af" : "#6b7280"}
              name="Price"
              label={{ value: "Price", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              type="number"
              stroke={darkMode ? "#9ca3af" : "#6b7280"}
              name="Demand"
              label={{ value: "Demand", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={tooltipStyle(darkMode)}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Scatter name="Products" data={chartData} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  // Fallback: compute from raw data
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const productMap = {};
  data.forEach((d) => {
    const productId = d.product_id || "Unknown";
    if (!productMap[productId]) {
      productMap[productId] = {
        product: `Product ${productId}`,
        demand: 0,
        price: 0,
        confidence: 0,
        count: 0,
      };
    }
    productMap[productId].demand += d.predicted_demand || d.target_demand || 0;
    productMap[productId].price += d.price || 0;
    productMap[productId].confidence += d.confidence || 0.7;
    productMap[productId].count++;
  });

  const chartData = Object.values(productMap)
    .map((prod) => ({
      ...prod,
      demand: parseFloat((prod.demand / prod.count).toFixed(2)),
      price: parseFloat((prod.price / prod.count).toFixed(2)),
      confidence: parseFloat((prod.confidence / prod.count).toFixed(3)),
    }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 10);

  return (
    <ChartContainer title="Top 10 Products by Demand" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            type="number"
            dataKey="price"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            name="Price"
            label={{ value: "Price", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            type="number"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            name="Demand"
            label={{ value: "Demand", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={tooltipStyle(darkMode)}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Scatter name="Products" data={chartData} fill="#8b5cf6" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Price Elasticity
export const PriceElasticityChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const sorted = [...data].sort((a, b) => (a.price || 0) - (b.price || 0));
  const chartData = sorted.map((d, i) => ({
    price: parseFloat((d.price || 0).toFixed(2)),
    demand: d.predicted_demand || d.target_demand || 0,
    index: i,
  }));

  return (
    <ChartContainer title="Price vs Demand (Elasticity)" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis dataKey="price" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Legend />
          <Line
            type="monotone"
            dataKey="demand"
            stroke="#ef4444"
            dot={false}
            name="Demand"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Holiday Impact
export const HolidayImpactChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const withHoliday = data.filter((d) => d.holiday_flag === 1);
  const noHoliday = data.filter((d) => d.holiday_flag === 0);

  const avgWithHoliday =
    withHoliday.length > 0
      ? (
          withHoliday.reduce(
            (sum, d) => sum + (d.predicted_demand || d.target_demand || 0),
            0,
          ) / withHoliday.length
        ).toFixed(2)
      : 0;

  const avgNoHoliday =
    noHoliday.length > 0
      ? (
          noHoliday.reduce(
            (sum, d) => sum + (d.predicted_demand || d.target_demand || 0),
            0,
          ) / noHoliday.length
        ).toFixed(2)
      : 0;

  const chartData = [
    {
      name: "Regular Days",
      demand: parseFloat(avgNoHoliday),
      count: noHoliday.length,
    },
    {
      name: "Holiday",
      demand: parseFloat(avgWithHoliday),
      count: withHoliday.length,
    },
  ];

  const boost = (
    ((avgWithHoliday - avgNoHoliday) / avgNoHoliday) *
    100
  ).toFixed(2);

  return (
    <ChartContainer title="Holiday Impact on Demand" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis dataKey="name" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Bar dataKey="demand" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div
        className={`mt-4 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}
      >
        <p
          className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
        >
          <span className="font-semibold">Holiday Boost: </span>
          {boost}%
        </p>
      </div>
    </ChartContainer>
  );
};

// Economic Index Impact
export const EconomicIndexChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const sorted = [...data].sort(
    (a, b) => (a.economic_index || 0) - (b.economic_index || 0),
  );
  const chartData = sorted.map((d) => ({
    economicIndex: parseFloat((d.economic_index || 0).toFixed(2)),
    demand: d.predicted_demand || d.target_demand || 0,
  }));

  return (
    <ChartContainer title="Economic Index Impact on Demand" darkMode={darkMode}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            type="number"
            dataKey="economicIndex"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            name="Economic Index"
            label={{
              value: "Economic Index",
              position: "insideBottom",
              offset: -10,
            }}
          />
          <YAxis
            type="number"
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            name="Demand"
            label={{ value: "Demand", angle: -90, position: "insideLeft" }}
          />
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
          <Scatter name="Correlation" data={chartData} fill="#ec4899" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Confidence Distribution
export const ConfidenceDistributionChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return <EmptyChart darkMode={darkMode} />;

  const confidenceData = data.filter((d) => d.confidence !== undefined);
  if (confidenceData.length === 0) return <EmptyChart darkMode={darkMode} />;

  const high = confidenceData.filter((d) => d.confidence >= 0.8).length;
  const medium = confidenceData.filter(
    (d) => d.confidence >= 0.6 && d.confidence < 0.8,
  ).length;
  const low = confidenceData.filter((d) => d.confidence < 0.6).length;

  const chartData = [
    { name: "High (≥0.8)", value: high, ...getColor(0) },
    { name: "Medium (0.6-0.8)", value: medium, ...getColor(1) },
    { name: "Low (<0.6)", value: low, ...getColor(2) },
  ];

  return (
    <ChartContainer
      title="Prediction Confidence Distribution"
      darkMode={darkMode}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, value, percent }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle(darkMode)} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Helper Components
const ChartContainer = ({ title, children, darkMode }) => (
  <div className="panel-card w-full p-5 md:p-6">
    <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
      {title}
    </h3>
    {children}
  </div>
);

const EmptyChart = ({ darkMode }) => (
  <div className="panel-soft flex h-80 w-full items-center justify-center">
    <p className="text-slate-600 dark:text-slate-300">No data available</p>
  </div>
);

const tooltipStyle = (darkMode) => ({
  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
  color: darkMode ? "#f3f4f6" : "#111827",
});

const getColor = (index) => {
  const colorObj = { fill: COLORS[index % COLORS.length] };
  return colorObj;
};
