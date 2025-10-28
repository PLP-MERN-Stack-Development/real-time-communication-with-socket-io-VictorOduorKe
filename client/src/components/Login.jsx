import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi, register as registerApi } from '../api/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login: setUser } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const fn = isRegister ? registerApi : loginApi
      const res = await fn(username, password)
      const { token, user } = res.data
      localStorage.setItem('token', token)
      setUser(user)
      navigate('/chat', { replace: true })
    } catch (err) {
      //console.error('Auth error:', err)
      setError(err.response?.data?.message || 'Failed to authenticate. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-indigo-100 rounded-3xl shadow-2xl p-10 sm:p-12 transition-all duration-500 hover:shadow-indigo-200">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-md">
              💬
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-500">
            {isRegister ? 'Join the conversation today' : 'Login to access your chats'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="block w-full rounded-xl border border-gray-300 bg-white placeholder-gray-400 px-2 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
              placeholder="e.g. alice"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="block w-full rounded-xl border border-gray-300 bg-white placeholder-gray-400 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
              placeholder="Your secure password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.14 5.82 3 7.94l3-2.65z"
                  ></path>
                </svg>
                {isRegister ? 'Registering...' : 'Logging in...'}
              </span>
            ) : (
              isRegister ? 'Register' : 'Login'
            )}
          </button>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              disabled={isLoading}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 transition"
            >
              {isRegister
                ? 'Already have an account? Login'
                : "Don’t have an account? Register"}
            </button>
            <p className="text-xs text-gray-400 mt-3">
              <a href="#" className="hover:underline">
                Need help?
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
