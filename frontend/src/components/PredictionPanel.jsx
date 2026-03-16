import React, { useState } from "react";
import { Zap, Loader } from "lucide-react";
import { useToast } from "../hooks/useToast";

export const PredictionPanel = ({ onPrediction, loading, darkMode }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    product_id: "",
    store_id: "",
    price: "",
    promotion_flag: 0,
    holiday_flag: 0,
    economic_index: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === ""
          ? ""
          : type === "number"
            ? parseFloat(value)
            : parseInt(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await onPrediction(formData);
      if (response) {
        setResult(response);
        showToast("Prediction successful!", "success");
      } else {
        showToast("Prediction failed. Please try again.", "error");
      }
    } catch (error) {
      showToast(error.message || "An error occurred", "error");
    }
  };

  return (
    <div className="panel-card p-6 md:p-8">
      <div className="flex items-center space-x-2 mb-6">
        <Zap className="text-teal-600 dark:text-teal-300" size={24} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Make a Prediction
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Product ID
            </label>
            <input
              type="number"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Store ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Store ID
            </label>
            <input
              type="number"
              name="store_id"
              value={formData.store_id}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Price */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Price ($)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              className="form-input"
            />
          </div>

          {/* Economic Index */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Economic Index
            </label>
            <input
              type="number"
              name="economic_index"
              value={formData.economic_index}
              onChange={handleChange}
              step="0.1"
              className="form-input"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col md:flex-row gap-6">
          <label className="flex items-center space-x-3 cursor-pointer text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="promotion_flag"
              checked={formData.promotion_flag === 1}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  promotion_flag: e.target.checked ? 1 : 0,
                }))
              }
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium">Active Promotion</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="holiday_flag"
              checked={formData.holiday_flag === 1}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  holiday_flag: e.target.checked ? 1 : 0,
                }))
              }
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium">Holiday Period</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-brand w-full space-x-2 py-3"
        >
          {loading && <Loader size={20} className="animate-spin" />}
          <span>{loading ? "Predicting..." : "Predict Demand"}</span>
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="panel-soft mt-8 border-l-4 border-teal-500 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Prediction Result
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">
                Predicted Demand:
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {result.predicted_demand}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {result.confidence_info}
              </span>
            </div>
            {result.model_metrics && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">
                  Model Metrics (R²: {result.model_metrics.r2?.toFixed(4)})
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
