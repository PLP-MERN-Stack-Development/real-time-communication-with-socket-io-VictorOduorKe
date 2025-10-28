import axios from './axiosInstance'

export const fetchFeatureFlags = async () => {
  try {
    const { data } = await axios.get('/config')
    return data
  } catch (err) {
   // console.warn('Failed to fetch feature flags:', err)
    return { enableGpt5Mini: false } // safe default
  }
}