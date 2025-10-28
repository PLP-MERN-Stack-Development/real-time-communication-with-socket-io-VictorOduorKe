import axios from './axiosInstance'

export const createChat = (name, userIds = [], isGroup = false) =>
  axios.post('/chats', { name, userIds, isGroup })

export const fetchChats = () => axios.get('/chats')

export const fetchUsers = () => axios.get('/users')
