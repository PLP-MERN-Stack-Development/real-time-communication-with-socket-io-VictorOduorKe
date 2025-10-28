// socketHandler.js - manage socket.io events and presence
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// onlineUsers maps userId -> socketId (for single socket) or array for multi
const onlineUsers = new Map();

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // client sends token-authenticated user info on connect
    socket.on('user_connected', async (user) => {
      try {
        // user: { id, username }
        if (!user || !user.id) return;
        onlineUsers.set(String(user.id), socket.id);

        // mark user online in DB (best-effort)
        try {
          await User.findByIdAndUpdate(user.id, { online: true }, { new: true });
        } catch (e) {
          // ignore DB errors
        }

        io.emit('userOnline', { userId: user.id });
      } catch (err) {
        console.error('user_connected error', err.message);
      }
    });

    socket.on('joinChat', (chatId) => {
      if (!chatId) return;
      socket.join(`chat_${chatId}`);
    });

    socket.on('leaveChat', (chatId) => {
      if (!chatId) return;
      socket.leave(`chat_${chatId}`);
    });

    socket.on('typing', ({ chatId, userId }) => {
      socket.to(`chat_${chatId}`).emit('typing', { chatId, userId });
    });

    socket.on('stopTyping', ({ chatId, userId }) => {
      socket.to(`chat_${chatId}`).emit('stopTyping', { chatId, userId });
    });

    socket.on('newMessage', async (data) => {
      // data: { chatId, senderId, content, attachments }
      try {
        if (!data.chatId || !data.senderId) return;
        const msg = await Message.create({ sender: data.senderId, chat: data.chatId, content: data.content, attachments: data.attachments || [] });
        await Chat.findByIdAndUpdate(data.chatId, { latestMessage: msg._id, updatedAt: Date.now() });

        const populated = await Message.findById(msg._id).populate('sender', 'username avatar');

        // emit to room
        io.to(`chat_${data.chatId}`).emit('messageReceived', populated);

        // also notify users directly (optional per-user notification)
        const chat = await Chat.findById(data.chatId).populate('users', '_id');
        if (chat && chat.users) {
          chat.users.forEach((u) => {
            const sid = onlineUsers.get(String(u._id));
            if (sid && sid !== socket.id) {
              io.to(sid).emit('newMessageNotification', { chatId: data.chatId, message: populated });
            }
          });
        }
      } catch (err) {
        console.error('Error on newMessage', err.message);
      }
    });

    socket.on('messageRead', async ({ messageId, userId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (!msg.readBy.includes(userId)) {
          msg.readBy.push(userId);
          await msg.save();
        }
        // notify room that message was read
        io.to(`chat_${msg.chat}`).emit('messageRead', { messageId, userId });
      } catch (err) {
        console.error('messageRead error', err.message);
      }
    });

    socket.on('disconnect', async () => {
      // remove user from onlineUsers map if present
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(userId);

          // Update DB lastSeen and online status (best-effort)
          try {
            await User.findByIdAndUpdate(userId, { online: false, lastSeen: Date.now() });
          } catch (e) {
            // ignore
          }

          io.emit('userOffline', { userId, lastSeen: Date.now() });
        }
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
}

module.exports = { initSocket, onlineUsers };
