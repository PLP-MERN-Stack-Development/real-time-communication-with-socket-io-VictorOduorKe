import React, { useState, useRef } from 'react'
import axios from '../api/axiosInstance'
import { useSocket } from '../context/SocketContext.jsx'
import uploadFile from '../api/uploads'
import clsx from 'clsx'

export default function MessageInput({ chatId, onSent }) {
  const [text, setText] = useState('')
  const { socket } = useSocket()
  const typingRef = useRef(null)
  const sentTypingRef = useRef(false)
  const [file, setFile] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() && !file) return
    setIsSending(true)
    setError('')

    // Request Notification permission inside the user gesture (send button click / form submit)
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission().catch(() => {})
      }
    } catch (err) {
      // ignore
    }

    // Prefer real-time path: emit via socket and let server persist and broadcast
    // If a file is attached, upload it first (authenticated request)
    let attachments = []
    if (file) {
      try {
        const up = await uploadFile(file)
        // store only the URL string to match Message.attachments schema (array of strings)
        if (up?.data?.url) attachments.push(up.data.url)
      } catch (err) {
        //console.error('File upload failed', err)
        setError('File upload failed. Try again.')
        setIsSending(false)
        return
      }
    }

    if (socket && socket.connected) {
      try {
        socket.emit('newMessage', { 
          chatId, 
          senderId: JSON.parse(localStorage.getItem('user')).id, 
          content: text, 
          attachments 
        })
        setText('')
        setFile(null)
        // Do not call onSent here; the ChatRoom listens for 'messageReceived' and will update messages
        // Emit stopTyping since user just sent
        try {
          socket.emit('stopTyping', { chatId, userId: JSON.parse(localStorage.getItem('user')).id })
          sentTypingRef.current = false
          if (typingRef.current) {
            clearTimeout(typingRef.current)
            typingRef.current = null
          }
        } catch (e) {}
      } catch (err) {
       // console.error('Socket send error', err)
        setError('Failed to send message. Please try again.')
      }
      setIsSending(false)
      return
    }

    // Fallback to REST API when socket is not available
    try {
      const res = await axios.post('/messages', { chatId, content: text, attachments })
      setText('')
      setFile(null)
      if (onSent) onSent(res.data)
    } catch (err) {
      //console.error(err)
      setError('Failed to send message. Please try again.')
    }
    setIsSending(false)
  }

  // handle typing emit: called from input onChange
  const handleTextChange = (e) => {
    const v = e.target.value
    setText(v)

    if (!socket || !socket.connected) return
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user) return

    // emit typing once then debounce stopTyping
    if (!sentTypingRef.current) {
      try {
        socket.emit('typing', { chatId, userId: user.id })
        sentTypingRef.current = true
      } catch (e) {}
    }

    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => {
      try {
        socket.emit('stopTyping', { chatId, userId: user.id })
      } catch (e) {}
      sentTypingRef.current = false
      typingRef.current = null
    }, 1400)
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files && e.target.files[0]
    if (selectedFile) {
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={send} className="message-input px-4 py-3 bg-linear-to-b from-slate-700 to-slate-800 border-t border-slate-600">
      {error && (
        <div className="mb-3 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2 rounded-xl text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="mb-3 flex items-center gap-2 p-2 bg-slate-600/50 rounded-lg border border-slate-500/50">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{file.name}</div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File Upload Button */}
        <div className="shrink-0">
          <label className={clsx(
            "inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 cursor-pointer border-2 border-dashed",
            file 
              ? "bg-teal-500/20 border-teal-400/50 text-teal-400" 
              : "bg-slate-600/50 border-slate-500/50 text-slate-400 hover:bg-slate-600 hover:border-slate-400 hover:text-slate-300"
          )}>
            <input 
              ref={fileInputRef}
              type="file" 
              className="sr-only" 
              onChange={handleFileSelect} 
              disabled={isSending} 
            />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative min-w-0">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Type your message..."
            disabled={isSending}
            rows={1}
            className="w-full px-6 py-4 pr-12 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm text-base"
            style={{ minHeight: '52px', maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          
          {/* Character Count */}
          {text.length > 0 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className={clsx(
                "text-xs px-2 py-1 rounded-full",
                text.length > 500 ? "bg-red-500/20 text-red-300" : "bg-slate-500/50 text-slate-300"
              )}>
                {text.length}/1000
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !file)}
          className={clsx(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 font-medium shadow-lg",
            isSending 
              ? "bg-teal-400 cursor-not-allowed" 
              : (!text.trim() && !file)
                ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                : "bg-linear-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 hover:shadow-xl active:scale-95"
          )}
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-600/50">
        <div className="text-xs text-slate-400">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </form>
  )
}