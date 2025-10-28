import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const url = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

    // create socket connection
    const socket = io(url, {
      auth: { token: token ? `Bearer ${token}` : undefined },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      const raw = localStorage.getItem('user')
      if (raw) {
        try {
          const user = JSON.parse(raw)
          socket.emit('user_connected', user)
        } catch (err) {}
      }
    })

    socket.on('disconnect', () => setConnected(false))

    return () => {
      // avoid disconnecting if socket never established (prevents "WebSocket closed before the connection is established" logs in dev)
      try {
        if (socket && socket.connected) {
          socket.disconnect()
        } else if (socket && typeof socket.removeAllListeners === 'function') {
          // remove listeners and allow garbage collection
          socket.removeAllListeners()
        }
      } catch (err) {
        // swallow errors during cleanup
      }
    }
  }, [])

  return <SocketContext.Provider value={{ socket: socketRef.current, connected }}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
