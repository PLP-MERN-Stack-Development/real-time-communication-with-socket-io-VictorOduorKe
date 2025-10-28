import React, { createContext, useContext, useState, useEffect } from 'react'
import { fetchFeatureFlags } from '../api/config'

const FeatureFlagsContext = createContext(null)

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({
    enableGpt5Mini: false,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const flags = await fetchFeatureFlags()
        setFlags(state => ({
          ...state,
          ...flags,
          isLoading: false
        }))
      } catch (error) {
        setFlags(state => ({
          ...state,
          error: 'Failed to load feature flags',
          isLoading: false
        }))
      }
    }
    loadFlags()
  }, [])

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider')
  }
  return context
}