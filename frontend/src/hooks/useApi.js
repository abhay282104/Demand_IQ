import { useState, useCallback } from 'react'
import { apiService } from '../services/api'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const request = useCallback(async (fn) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result.data)
      return result.data
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'An error occurred'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, data, request }
}

export const usePrediction = () => {
  const [predictions, setPredictions] = useState([])
  const { loading, error, request } = useApi()

  const makePrediction = useCallback(
    async (predictionData) => {
      const result = await request(() => apiService.predict(predictionData))
      if (result) {
        setPredictions(prev => [{
          ...predictionData,
          ...result,
          timestamp: new Date().toISOString(),
        }, ...prev])
      }
      return result
    },
    [request]
  )

  return {
    predictions,
    loading,
    error,
    makePrediction,
  }
}

export const useDashboard = () => {
  const { loading, error, data, request } = useApi()

  const fetchSummary = useCallback(
    () => request(() => apiService.getDashboardSummary()),
    [request]
  )

  return {
    summary: data,
    loading,
    error,
    fetchSummary,
  }
}

export const useSalesData = () => {
  const { loading, error, data, request } = useApi()

  const fetchProductSales = useCallback(
    (productId, days = 365) =>
      request(() => apiService.getSalesByProduct(productId, days)),
    [request]
  )

  const fetchStoreSales = useCallback(
    (storeId, days = 365) =>
      request(() => apiService.getSalesByStore(storeId, days)),
    [request]
  )

  return {
    data,
    loading,
    error,
    fetchProductSales,
    fetchStoreSales,
  }
}

export const useTopProducts = () => {
  const { loading, error, data, request } = useApi()

  const fetchTop = useCallback(
    (limit = 10) => request(() => apiService.getTopProducts(limit)),
    [request]
  )

  return {
    topProducts: data,
    loading,
    error,
    fetchTop,
  }
}
