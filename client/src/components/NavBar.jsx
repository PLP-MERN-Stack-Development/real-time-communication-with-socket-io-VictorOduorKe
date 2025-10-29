import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const mobileMenuRef = useRef(null)

  // close mobile menu when clicking outside or on escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileOpen(false)
      }
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const handleLogout = () => {
    try {
      logout()
    } catch (e) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    navigate('/login', { replace: true })
  }

  return (
    <header className="w-full h-16 bg-linear-to-r from-purple-600 via-indigo-600 to-teal-500 text-white shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center gap-6">
            {/* Brand Logo */}
            <div 
              onClick={() => navigate('/chat')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all duration-200">
                <span className="text-lg">💬</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                ChatApp
              </h1>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => navigate('/chat')}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-white/0 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                Chats
              </button>
              <button 
                className="px-3 py-1 rounded-lg text-sm font-medium bg-white/0 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                Profile
              </button>
            </nav>
          </div>

          {/* Right Section - User Info & Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold leading-tight">
                  {user?.username || 'Loading...'}
                </div>
                <div className="text-xs opacity-80 leading-tight">
                  Online
                </div>
              </div>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <button 
                className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/40 transition-all duration-200 backdrop-blur-sm overflow-hidden shadow-md hover:shadow-lg"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-400 to-indigo-500 text-white font-semibold rounded-full">
                    {user?.username ? user.username[0].toUpperCase() : '?'}
                  </div>
                )}
              </button>

              {/* Mobile Menu Button */}
              <div className="relative md:hidden" ref={mobileMenuRef}>
                <button
                  onClick={() => setIsMobileOpen((s) => !s)}
                  aria-expanded={isMobileOpen}
                  aria-label="Open menu"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Mobile Dropdown Menu */}
                <div className={
                  `absolute right-0 top-12 w-48 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 py-2 transform transition-all duration-200 z-50 ` +
                  (isMobileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2')
                }>
                  <button 
                    onClick={() => navigate('/chat')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-900 hover:bg-purple-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chats
                  </button>
                  <button 
                    className="w-full px-4 py-3 text-left text-sm text-slate-900 hover:bg-purple-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Logout Button */}
            <button 
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}