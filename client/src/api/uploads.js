import axios from './axiosInstance'

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return axios.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export default uploadFile
