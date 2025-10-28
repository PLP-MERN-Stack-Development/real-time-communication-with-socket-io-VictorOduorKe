import React, { useEffect, useState, useRef } from 'react'
import axios from '../api/axiosInstance'
import { createChat, fetchChats, fetchUsers } from '../api/chat'
import { useSocket } from '../context/SocketContext.jsx'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../api/users'
import clsx from 'clsx'

export default function Sidebar({ onSelectChat, onSidebarToggle }) {
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [users, setUsers] = useState([])
  const { socket } = useSocket()
  const [selected, setSelected] = useState([])
  const [isGroup, setIsGroup] = useState(false)
  const [name, setName] = useState('')
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isInitialMount = useRef(true)
  const authChecked = useRef(false)

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('No user data found')
      }
      const userData = JSON.parse(userStr)
      
      const [chatsRes, usersRes] = await Promise.all([
        fetchChats(),
        fetchUsers()
      ])
      
      setChats(chatsRes.data || [])
      setUsers((usersRes.data || []).filter(u => String(u._id) !== String(userData.id)))
    } catch (err) {
     // console.error('Failed to load data:', err)
      if (err.response?.status === 401 && err.response?.data?.message === 'Invalid token') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
      }
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (authChecked.current) return
    authChecked.current = true

    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      navigate('/login', { replace: true })
      return
    }

    loadData()
  }, [navigate, loadData])

  useEffect(() => {
    if (!socket || isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const onOnline = ({ userId }) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          String(user._id) === String(userId) 
            ? { ...user, online: true, lastSeen: null } 
            : user
        )
      )
    }

    const onOffline = ({ userId, lastSeen }) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          String(user._id) === String(userId) 
            ? { ...user, online: false, lastSeen: lastSeen || user.lastSeen } 
            : user
        )
      )
    }

    socket.on('userOnline', onOnline)
    socket.on('userOffline', onOffline)

    return () => {
      socket.off('userOnline', onOnline)
      socket.off('userOffline', onOffline)
    }
  }, [socket])

  const toggleSidebar = React.useCallback(() => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    // Notify parent component about sidebar state change
    if (onSidebarToggle) {
      onSidebarToggle(newState)
    }
  }, [sidebarCollapsed, onSidebarToggle])

  const openNew = React.useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        navigate('/login', { replace: true })
        return
      }
      
      setIsLoading(true)
      setShowNew(true)
      setSelected([])
      setIsGroup(false)
      setName('')
      
      const userData = JSON.parse(userStr)
      const res = await fetchUsers()
      setUsers(res.data.filter(u => String(u._id) !== String(userData.id)))
    } catch (err) {
    // console.error('Failed to fetch users:', err)
      if (err.response?.status === 401) {
        navigate('/login', { replace: true })
      }
      setShowNew(false)
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  const toggleSelect = React.useCallback((id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  const submitNew = React.useCallback(async (e) => {
    e.preventDefault()
    if (!selected.length) {
      alert('Select at least one user')
      return
    }
    
    try {
      const res = await createChat(isGroup ? name : null, selected, isGroup)
      setShowNew(false)
      setSelected([])
      setName('')
      await loadData()
      onSelectChat(res.data)
    } catch (err) {
      //console.error(err)
      alert(err.response?.data?.message || err.message)
    }
  }, [isGroup, name, selected, loadData, onSelectChat])

  const handleLogout = React.useCallback(() => {
    try {
      if (socket && typeof socket.disconnect === 'function') socket.disconnect()
    } catch (e) {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }, [socket, navigate]);

  const submitProfile = React.useCallback(async (e) => {
    e.preventDefault()
    try {
      const form = new FormData()
      if (avatarFile) form.append('avatar', avatarFile)
      form.append('bio', bio)
      const res = await updateProfile(form)
      const usr = res.data
      localStorage.setItem('user', JSON.stringify({ id: usr._id, username: usr.username, avatar: usr.avatar, bio: usr.bio }))
      setUsers((prev) => prev.map(u => String(u._id) === String(usr._id) ? usr : u))
      setShowProfileEdit(false)
      setAvatarFile(null)
      setBio('')
    } catch (err) {
     // console.error(err)
      alert(err.response?.data?.message || err.message)
    }
  }, [avatarFile, bio]);

  const openProfileEdit = React.useCallback(() => {
    setShowProfileEdit(true)
  }, [])

  return (
    <>
      {/* Sidebar Toggle Button (visible when sidebar is collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-20 z-40 p-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div className={clsx(
        "bg-gradient-to-b from-white to-gray-50/80 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out relative z-30 h-full",
        sidebarCollapsed ? "w-0 opacity-0 -translate-x-full" : "w-80 opacity-100 translate-x-0"
      )}>
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {JSON.parse(localStorage.getItem('user'))?.username?.slice(0,1).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Messages</h2>
                <p className="text-xs text-gray-500">Active conversations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={openProfileEdit}
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all duration-200"
                title="Edit Profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button 
                onClick={openNew}
                className="p-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                title="New Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button 
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all duration-200"
                title="Collapse Sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* New Chat Form */}
            {showNew && (
              <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">New Conversation</h3>
                  <button 
                    onClick={() => setShowNew(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={submitNew} className="space-y-4">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <input 
                      type="checkbox" 
                      checked={isGroup} 
                      onChange={(e) => setIsGroup(e.target.checked)} 
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Create group chat</label>
                  </div>
                  
                  {isGroup && (
                    <div>
                      <input 
                        placeholder="Group name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-auto border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                    {isLoading ? (
                      <div className="text-center py-4 text-gray-500">Loading users...</div>
                    ) : (
                      users.map(u => (
                        <div key={u._id} className="py-2 px-2 hover:bg-white rounded-lg transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selected.includes(u._id)} 
                              onChange={() => toggleSelect(u._id)} 
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className={clsx(
                                "w-2 h-2 rounded-full",
                                u.online ? "bg-green-500" : "bg-gray-300"
                              )} />
                              <span className="text-sm font-medium text-gray-700">{u.username}</span>
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit" 
                      disabled={isLoading || selected.length === 0}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Create Chat
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Chats List */}
            <div className="space-y-2 mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Recent Chats</h3>
              {chats.map((c) => (
                <div 
                  key={c._id} 
                  onClick={() => onSelectChat(c)} 
                  className="p-3 cursor-pointer hover:bg-white rounded-xl border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="font-semibold text-gray-800 mb-1 group-hover:text-teal-700 transition-colors">
                    {c.isGroup ? c.name || 'Group chat' : c.users.map(u => u.username).join(', ')}
                  </div>
                  <div className="text-sm text-gray-500 truncate flex items-center gap-2">
                    <span className="flex-1 truncate">{c.latestMessage?.content || 'No messages yet'}</span>
                    {c.latestMessage && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(c.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Online Users */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Online Users</h3>
              <div className="space-y-2 max-h-64 overflow-auto">
                {users.filter(u => u.online).map(u => (
                  <div 
                    key={u._id} 
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-all duration-200 group"
                    onClick={async () => {
                      try {
                        const res = await createChat(null, [u._id], false)
                        await loadData()
                        onSelectChat(res.data)
                      } catch (err) {
                        //console.error(err)
                      }
                    }}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-medium text-sm shadow-sm">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          u.username?.slice(0,1).toUpperCase()
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm group-hover:text-teal-700 transition-colors">
                        {u.username}
                      </div>
                      <div className="text-xs text-green-600 font-medium">Online</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Users */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">All Users</h3>
              <div className="space-y-2 max-h-64 overflow-auto">
                {users.map(u => (
                  <div 
                    key={u._id} 
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-all duration-200 group"
                    onClick={async () => {
                      try {
                        const res = await createChat(null, [u._id], false)
                        await loadData()
                        onSelectChat(res.data)
                      } catch (err) {
                        //console.error(err)
                      }
                    }}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm shadow-sm">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          u.username?.slice(0,1).toUpperCase()
                        )}
                      </div>
                      <div className={clsx(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                        u.online ? "bg-green-500" : "bg-gray-400"
                      )}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm group-hover:text-teal-700 transition-colors">
                        {u.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        {u.online ? 'Online' : u.lastSeen ? `Last seen ${new Date(u.lastSeen).toLocaleTimeString()}` : 'Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Profile</h3>
              <button 
                onClick={() => setShowProfileEdit(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={submitProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setAvatarFile(e.target.files[0])} 
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="w-full min-h-[100px] border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us something about yourself..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowProfileEdit(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}