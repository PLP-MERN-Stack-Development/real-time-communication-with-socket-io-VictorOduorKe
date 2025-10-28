import axios from 'axios'

const baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

const axiosInstance = axios.create({
  baseURL: baseURL + '/api',
  withCredentials: true // Enable sending cookies with requests
})

// Attach Authorization header (Bearer token) from localStorage to every request.
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers = config.headers || {}
        // Preserve existing headers and add Authorization
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // ignore localStorage errors in non-browser env
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default axiosInstance
