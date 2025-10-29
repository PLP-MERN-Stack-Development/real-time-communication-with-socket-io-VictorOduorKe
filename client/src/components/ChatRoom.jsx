import React, { useEffect, useState } from 'react'
import axios from '../api/axiosInstance'
import { useSocket } from '../context/SocketContext.jsx'
import Sidebar from './Sidebar'
import NavBar from './NavBar'
import MessageInput from './MessageInput'
import clsx from 'clsx'

export default function ChatRoom() {
  const { socket } = useSocket()
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([]) // array of { id, username }
  const [showProfile, setShowProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMessages, setIsFetchingMessages] = useState(false)
  const [error, setError] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 700
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
      o.stop(ctx.currentTime + 0.13)
    } catch (err) {
      // ignore audio errors
    }
  }

  const handleSidebarToggle = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed)
  }

  useEffect(() => {
    if (!socket) return

    let isSubscribed = true;

    const onMessage = (message) => {
      if (!isSubscribed) return;
      
      if (activeChat && String(message.chat) === String(activeChat._id)) {
        setMessages((m) => {
          if (m.some(msg => String(msg._id) === String(message._id))) return m;
          return [...m, message];
        });
      } else {
        // notification for messages in other chats
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('New message', { body: message.content || 'New message received' });
        }
        playBeep();
      }
    };

    const onMessageRead = ({ messageId, userId }) => {
      if (!isSubscribed) return;
      
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => {
          if (String(msg._id) === String(messageId)) {
            const readBy = Array.isArray(msg.readBy) ? [...msg.readBy] : [];
            if (!readBy.some(r => String(r) === String(userId))) readBy.push(userId);
            return { ...msg, readBy };
          }
          return msg;
        });
        
        if (JSON.stringify(updatedMessages) === JSON.stringify(prev)) return prev;
        return updatedMessages;
      });
    };

    const onNotif = ({ chatId, message }) => {
      if (!isSubscribed) return;
      
      if (!activeChat || String(chatId) !== String(activeChat._id)) {
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('New message', { body: message.content || 'New message received' });
        }
        playBeep();
      }
    };

    const onTyping = ({ chatId, userId }) => {
      if (!isSubscribed || !activeChat || String(chatId) !== String(activeChat._id)) return;
      
      const userObj = activeChat.users.find(u => String(u._id) === String(userId));
      const username = userObj ? userObj.username : 'Someone';
      
      setTypingUsers((prev) => {
        if (prev.some(p => String(p.id) === String(userId))) return prev;
        return [...prev, { id: userId, username }];
      });
    };

    const onStopTyping = ({ chatId, userId }) => {
      if (!isSubscribed || !activeChat || String(chatId) !== String(activeChat._id)) return;
      
      setTypingUsers((prev) => {
        const filtered = prev.filter((p) => String(p.id) !== String(userId));
        if (filtered.length === prev.length) return prev;
        return filtered;
      });
    };

    socket.on('messageReceived', onMessage);
    socket.on('newMessageNotification', onNotif);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    socket.on('messageRead', onMessageRead);

    return () => {
      isSubscribed = false;
      socket.off('messageReceived', onMessage);
      socket.off('newMessageNotification', onNotif);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
      socket.off('messageRead', onMessageRead);
    };
  }, [socket, activeChat?._id, activeChat?.users])

  // Update activeChat users presence when server emits userOnline/userOffline
  useEffect(() => {
    if (!socket || !activeChat) return

    let isSubscribed = true;

    const onOnline = ({ userId }) => {
      if (!isSubscribed) return;
      setActiveChat((c) => {
        if (!c || !c.users) return c;
        const updatedUsers = c.users.map(u => 
          String(u._id) === String(userId) ? { ...u, online: true, lastSeen: null } : u
        );
        if (JSON.stringify(updatedUsers) === JSON.stringify(c.users)) return c;
        return { ...c, users: updatedUsers };
      });
    };

    const onOffline = ({ userId, lastSeen }) => {
      if (!isSubscribed) return;
      setActiveChat((c) => {
        if (!c || !c.users) return c;
        const updatedUsers = c.users.map(u => 
          String(u._id) === String(userId) ? { ...u, online: false, lastSeen: lastSeen || u.lastSeen } : u
        );
        if (JSON.stringify(updatedUsers) === JSON.stringify(c.users)) return c;
        return { ...c, users: updatedUsers };
      });
    };

    socket.on('userOnline', onOnline);
    socket.on('userOffline', onOffline);

    return () => {
      isSubscribed = false;
      socket.off('userOnline', onOnline);
      socket.off('userOffline', onOffline);
    };
  }, [socket, activeChat?._id])

  const loadMessages = async (chat) => {
    setActiveChat(chat)
    setIsFetchingMessages(true)
    setError('')
    try {
      const res = await axios.get('/messages', { params: { chatId: chat._id } })
      setMessages(res.data)
      if (socket) {
        socket.emit('joinChat', chat._id)
        // mark messages as read for this user when they load the chat
        const meId = JSON.parse(localStorage.getItem('user')).id
        res.data.forEach((msg) => {
          const senderId = (msg.sender && msg.sender._id) ? String(msg.sender._id) : String(msg.sender)
          const alreadyRead = Array.isArray(msg.readBy) && msg.readBy.some(r => String(r) === String(meId))
          if (!alreadyRead && String(senderId) !== String(meId)) {
            socket.emit('messageRead', { messageId: msg._id, userId: meId })
            // update local state optimistically
            setMessages((prev) => prev.map(m => String(m._id) === String(msg._id) ? { ...m, readBy: Array.isArray(m.readBy) ? [...m.readBy, meId] : [meId] } : m))
          }
        })
      }
    } catch (err) {
      //console.error(err)
      setError('Failed to load messages. Please try again.')
    } finally {
      setIsFetchingMessages(false)
    }
  }

  // Called by MessageInput when a message is successfully sent via REST fallback.
  const handleSent = (message) => {
    setMessages((m) => [...m, message])
  }

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with toggle functionality */}
        <div className={clsx(
          "shrink-0 border-r border-slate-700 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-0" : "w-80"
        )}>
          <Sidebar 
            onSelectChat={loadMessages} 
            onSidebarToggle={handleSidebarToggle}
          />
        </div>
        
        {/* Main Chat Area - expands when sidebar is collapsed */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarCollapsed ? "ml-0" : ""
        )}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 m-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {!activeChat ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Welcome to ChatApp</h3>
                <p className="text-slate-300 mb-4">
                  {sidebarCollapsed 
                    ? "Select the menu button to view your conversations" 
                    : "Select a conversation from the sidebar to start messaging"
                  }
                </p>
                {sidebarCollapsed && (
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Show Conversations
                  </button>
                )}
              </div>
            </div>
          ) : isFetchingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-slate-300">Loading messages...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  {sidebarCollapsed && (
                    <button
                      onClick={() => setSidebarCollapsed(false)}
                      className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
                      title="Show Sidebar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  <div>
                    <strong className="text-lg text-white font-semibold">{activeChat.isGroup ? activeChat.name || 'Group chat' : activeChat.users.map(u => u.username).join(', ')}</strong>
                    <div className="text-sm text-slate-300">
                      {typingUsers.length ? (
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <em>{typingUsers.length === 1 ? `${typingUsers[0].username} is typing...` : `${typingUsers.map(u=>u.username).join(', ')} are typing...`}</em>
                        </div>
                      ) : (
                        !activeChat.isGroup && activeChat.users && activeChat.users.length ? (
                          (() => {
                            const meId = JSON.parse(localStorage.getItem('user')).id
                            const other = activeChat.users.find(u => String(u._id) !== String(meId))
                            if (!other) return null
                            return other.online ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Online</span>
                              </div>
                            ) : (other.lastSeen ? `Last seen ${new Date(other.lastSeen).toLocaleTimeString()}` : 'Offline')
                          })()
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <button 
                    className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-all duration-200 font-medium border border-slate-600 hover:border-slate-500" 
                    onClick={() => setShowProfile((s) => !s)}
                  >
                    {showProfile ? 'Hide Profile' : 'Show Profile'}
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages flex-1 overflow-auto py-8 px-8 space-y-6">
                {messages.map((m, index) => {
                  const meId = JSON.parse(localStorage.getItem('user')).id
                  const senderId = (m.sender && m.sender._id) ? String(m.sender._id) : String(m.sender)
                  const isMine = String(meId) === String(senderId)
                  const otherReaders = (m.readBy || []).filter(r => String(r) !== String(meId))
                  const status = isMine ? (otherReaders.length ? 'Read' : 'Delivered') : null
                  // Generate a stable key using message ID or fallback to index
                  const messageKey = m._id || `temp-${index}-${Date.now()}`
                  
                  // Check if this message is from the same sender as the previous one
                  const prevMessage = messages[index - 1]
                  const isSameSender = prevMessage && 
                    String((prevMessage.sender && prevMessage.sender._id) ? String(prevMessage.sender._id) : String(prevMessage.sender)) === String(senderId)
                  
                  // Check if this message is consecutive (within 2 minutes)
                  const isConsecutive = prevMessage && 
                    (new Date(m.createdAt) - new Date(prevMessage.createdAt)) < 2 * 60 * 1000

                  return (
                    <div 
                      key={messageKey}
                      className={clsx(
                        'message-row flex transition-all duration-200',
                        isMine ? 'justify-end' : 'justify-start',
                        isSameSender && isConsecutive ? 'mt-1' : 'mt-6'
                      )}
                    >
                      <div className={clsx(
                        'max-w-[70%] px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm border',
                        isMine 
                          ? 'bg-linear-to-br from-teal-500 to-teal-600 text-white border-teal-400/20 rounded-tr-md' 
                          : 'bg-slate-700/80 text-slate-100 border-slate-600/50 rounded-tl-md',
                        isSameSender && isConsecutive ? (isMine ? 'rounded-br-2xl' : 'rounded-bl-2xl') : 'rounded-2xl'
                      )}>
                        {/* Sender name in group chats */}
                        {!isMine && activeChat.isGroup && !(isSameSender && isConsecutive) && (
                          <div className="text-sm font-semibold text-teal-300 mb-2">{m.sender?.username || 'Someone'}</div>
                        )}
                        
                        {/* Message content */}
                        <div className="whitespace-pre-wrap wrap-break-word leading-relaxed text-[15px]">
                          {m.content}
                        </div>
                        
                        {/* Attachments */}
                        {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                          <div className="mt-4 flex flex-col gap-3">
                            {m.attachments.map((a, idx) => {
                              const baseUrl = typeof a === 'string' ? a : (a.url || '')
                              const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'
                              const url = baseUrl.startsWith('http') ? baseUrl : `${serverUrl}${baseUrl}`
                              const lower = (url || '').toLowerCase()
                              const isImage = lower.match(/\.(png|jpe?g|gif|webp|svg)$/)
                              return isImage ? (
                                <img 
                                  key={idx} 
                                  src={url} 
                                  alt={`attachment-${idx}`} 
                                  className="max-h-80 w-auto rounded-xl object-cover shadow-lg border border-slate-600/50" 
                                  onError={(e) => {
                                    //console.error('Image load error:', url);
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMTIiIHk9IjEyIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+P'
                                  }}
                                />
                              ) : (
                                <a 
                                  key={idx} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-600/50 rounded-lg text-blue-300 hover:text-blue-200 transition-colors border border-slate-500/30"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-sm break-all">Download File</span>
                                </a>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Message metadata */}
                        <div className={clsx(
                          "message-meta mt-3 flex items-center gap-3 text-xs",
                          isMine ? "text-teal-100/80" : "text-slate-400"
                        )}>
                          <div>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {status && (
                            <div className={clsx(
                              "flex items-center gap-1",
                              status === 'Read' ? "text-green-300" : "text-slate-300"
                            )}>
                              {status}
                              {status === 'Read' && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm">
                <MessageInput chatId={activeChat._id} onSent={handleSent} />
              </div>

              {/* Participants Panel */}
              {showProfile && (
                <div className="border-t border-slate-700 p-6 bg-slate-800/90 backdrop-blur-sm">
                  <h4 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Participants ({activeChat.users.length})
                  </h4>
                  <div className="grid gap-3">
                    {activeChat.users.map((u) => (
                      <div key={u._id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 overflow-hidden flex items-center justify-center text-white font-semibold shadow-lg">
                            {u.avatar ? (
                              <img 
              src={u.avatar} 
              alt={u.username} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = ''; // Clear the broken image
                e.target.parentElement.innerHTML = u.username?.slice(0,1).toUpperCase();
              }}
            />
                            ) : (
                              u.username?.slice(0,1).toUpperCase()
                            )}
                          </div>
                          <div className={clsx(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800",
                            u.online ? "bg-green-500" : "bg-slate-500"
                          )}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-white">{u.username}</strong>
                            {u.online && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">Online</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-300">
                            {u.online ? 'Active now' : (u.lastSeen ? `Last seen ${new Date(u.lastSeen).toLocaleString()}` : 'Offline')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}