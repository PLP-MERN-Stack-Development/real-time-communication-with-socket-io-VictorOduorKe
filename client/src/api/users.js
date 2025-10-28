import axios from './axiosInstance'

export const getMe = () => axios.get('/users/me')

export const updateProfile = (formData) =>
  axios.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export default { getMe, updateProfile }
