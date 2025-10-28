import axios from './axiosInstance'

export const register = (username, password) => axios.post('/auth/register', { username, password })
export const login = (username, password) => axios.post('/auth/login', { username, password })
