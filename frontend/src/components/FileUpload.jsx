import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";
import { CloudUploadIcon, CheckCircleIcon, ExclamationIcon } from "./Icons";
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
} from "./AnalyticsCharts";

export const FileUpload = ({ darkMode = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { showToast } = useToast();

  // prediction menu state (manual input)
  const [predictionInput, setPredictionInput] = useState({
    product: "",
    store: "",
    price: "",
    promotion: "",
    holiday: "",
    economic: "",
  });
  const [simplePrediction, setSimplePrediction] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setFileName(files[0].name);
      setResults(null);
      setError(null);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setFileName(files[0].name);
      setResults(null);
      setError(null);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith(".csv")) {
      showToast("Please upload a CSV file", "error");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const axiosResp = await apiService.uploadCSV(formData);
      const resp = axiosResp.data;

      if (resp && resp.status === "success") {
        setResults({ ...resp, type: "predict" });
        setSimplePrediction(null);
        showToast("Predictions generated successfully!", "success");
      } else {
        const msg = resp?.detail || "Unexpected response from server";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("upload error", err);
      const errorMsg =
        err.response?.data?.detail || "Failed to upload and process file";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionChange = (e) => {
    const { name, value } = e.target;
    setPredictionInput((prev) => ({ ...prev, [name]: value }));
  };

  const runSimplePrediction = async () => {
    if (!predictionInput.product) {
      showToast("Please enter a product ID to predict.", "error");
      return;
    }
    if (!predictionInput.price) {
      showToast("Please provide a price for prediction.", "error");
      return;
    }
    const payload = {
      product_id: parseInt(predictionInput.product),
      store_id: predictionInput.store
        ? parseInt(predictionInput.store)
        : undefined,
      price: parseFloat(predictionInput.price),
      promotion_flag: predictionInput.promotion
        ? parseInt(predictionInput.promotion)
        : 0,
      holiday_flag: predictionInput.holiday
        ? parseInt(predictionInput.holiday)
        : 0,
      economic_index: predictionInput.economic
        ? parseFloat(predictionInput.economic)
        : 0,
    };
    try {
      const resp = await apiService.predict(payload);
      setSimplePrediction(resp.data);
    } catch (err) {
      console.error("simple prediction error", err);
      showToast("Could not get prediction", "error");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Upload Area */}
      {!results && (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold">Upload your data</h2>
          </div>

          <div
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-slate-300 hover:border-primary/50 dark:border-slate-600"
            } ${loading ? "opacity-50 pointer-events-none" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleChange}
              disabled={loading}
              className="hidden"
              id="csv-input"
            />

            <label htmlFor="csv-input" className="cursor-pointer">
              <div className="flex justify-center mb-4">
                <CloudUploadIcon className="w-16 h-16 text-primary/60" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">
                Upload CSV File
              </h3>
              <p className="mb-4 text-slate-600 dark:text-slate-300">
                Drag and drop your CSV file here or click to browse
              </p>
              <div className="btn-brand inline-flex px-4 py-2">
                {loading ? "Processing..." : "Select File"}
              </div>
            </label>

            {fileName && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-semibold">{fileName}</span>
              </p>
            )}

            {selectedFile && !loading && (
              <div className="mt-4">
                <button
                  onClick={() => handleFile(selectedFile)}
                  className="btn-brand px-6 py-2"
                >
                  Prediction & Analysis
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-200">
                Error
              </h4>
              <p className="text-red-800 dark:text-red-300 text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              setResults(null);
              setFileName("");
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Try Another File
          </button>
        </div>
      )}

      {/* Results Display */}
      {results && (results.type === "predict" || results.type === "train") && (
        <div className="mt-8 space-y-6">
          {/* Training summary (only for train mode) */}
          {results.type === "train" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Training Complete
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dataset Rows
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {results.dataset_summary?.total_rows}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unique Products
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.dataset_summary?.unique_products}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unique Stores
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {results.dataset_summary?.unique_stores}
                  </p>
                </div>
              </div>

              {results.metrics && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      MAE
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {results.metrics.mae?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      RMSE
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {results.metrics.rmse?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      R²
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {results.metrics.r2?.toFixed(3)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Prediction Complete
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Rows
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.analytics.total_rows}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Successful
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {results.analytics.successful_predictions}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {results.analytics.failed_predictions}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Confidence
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {results.analytics.average_confidence
                    ? (results.analytics.average_confidence * 100).toFixed(1)
                    : "N/A"}
                  %
                </p>
              </div>
            </div>

            {/* Analytics Details */}
            {results.analytics.average_predicted_demand && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Avg Demand
                  </p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {results.analytics.average_predicted_demand.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Min Demand
                  </p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {results.analytics.min_predicted_demand.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Max Demand
                  </p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {results.analytics.max_predicted_demand.toFixed(2)}
                  </p>
                </div>
                {results.analytics.mae && (
                  <>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                        MAE
                      </p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {results.analytics.mae.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                        RMSE
                      </p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {results.analytics.rmse.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                        MAPE
                      </p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {results.analytics.mape.toFixed(2)}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Prediction Menu */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Quick Prediction
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Product ID
                  </label>
                  <input
                    type="number"
                    name="product"
                    value={predictionInput.product}
                    onChange={handlePredictionChange}
                    className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Store ID (optional)
                  </label>
                  <input
                    type="number"
                    name="store"
                    value={predictionInput.store}
                    onChange={handlePredictionChange}
                    className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={predictionInput.price}
                    onChange={handlePredictionChange}
                    className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Promotion Flag (0/1)
                  </label>
                  <input
                    type="number"
                    name="promotion"
                    value={predictionInput.promotion}
                    onChange={handlePredictionChange}
                    className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Holiday Flag (0/1)
                  </label>
                  <input
                    type="number"
                    name="holiday"
                    value={predictionInput.holiday}
                    onChange={handlePredictionChange}
                    className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Economic Index
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="economic"
                    value={predictionInput.economic}
                    onChange={handlePredictionChange}
                    className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={runSimplePrediction}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Predict Demand
              </button>
            </div>

            {simplePrediction && (
              <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p
                  className={`text-base ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  For <strong>product {predictionInput.product}</strong>
                  {predictionInput.store
                    ? ` in store ${predictionInput.store}`
                    : ""}
                  , the model predicts a demand of{" "}
                  <strong>
                    {Number(simplePrediction.predicted_demand).toLocaleString()}
                  </strong>{" "}
                  units.
                </p>
                <p
                  className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Confidence: {simplePrediction.confidence_info}
                </p>
              </div>
            )}
          </div>

          {/* Analytics Visualizations */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Data Analytics Visualizations
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DemandDistributionChart
                data={results.predictions}
                darkMode={darkMode}
              />
              <PriceDistributionChart
                data={results.predictions}
                darkMode={darkMode}
              />

              <CategoryPerformanceChart
                data={results.predictions}
                darkMode={darkMode}
              />
              <StorePerformanceChart
                data={results.predictions}
                darkMode={darkMode}
              />

              <div className="lg:col-span-2">
                <ProductPerformanceChart
                  data={results.predictions}
                  darkMode={darkMode}
                />
              </div>

              <div className="lg:col-span-2">
                <PriceElasticityChart
                  data={results.predictions}
                  darkMode={darkMode}
                />
              </div>

              <HolidayImpactChart
                data={results.predictions}
                darkMode={darkMode}
              />

              <div className="lg:col-span-2">
                <EconomicIndexChart
                  data={results.predictions}
                  darkMode={darkMode}
                />
              </div>

              <div className="lg:col-span-2">
                <ConfidenceDistributionChart
                  data={results.predictions}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setResults(null);
                setFileName("");
                setError(null);
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Upload Another File
            </button>
            <button
              onClick={() => {
                const csv = convertToCSV(results.predictions);
                downloadCSV(csv, "predictions_results.csv");
              }}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Export Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to convert predictions to CSV
const convertToCSV = (predictions) => {
  const headers = [
    "Date",
    "Product ID",
    "Store ID",
    "Category ID",
    "Price",
    "Promotion",
    "Holiday",
    "Economic Index",
    "Predicted Demand",
    "Confidence (%)",
    "Actual Demand",
  ];

  const rows = predictions.map((pred) => [
    pred.date || "",
    pred.product_id || "",
    pred.store_id || "",
    pred.category_id || "",
    pred.price || "",
    pred.promotion_flag || "",
    pred.holiday_flag || "",
    pred.economic_index || "",
    pred.predicted_demand?.toFixed(2) || "",
    pred.confidence ? (pred.confidence * 100).toFixed(1) : "",
    pred.actual_demand?.toFixed(2) || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
};

// Helper function to download CSV
const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};
