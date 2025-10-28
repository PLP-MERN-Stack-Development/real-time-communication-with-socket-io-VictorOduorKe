// server.js - Main server setup (Express + Socket.io + routes + DB)
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');


const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const { initSocket } = require('./socket/socketHandler');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://real-time-communications.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// middlewares
app.use(cors({ origin: process.env.CLIENT_URL || 'https://real-time-communications.netlify.app', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Debug middleware for file requests
app.use((req, res, next) => {
  if (req.url.startsWith('/uploads') || req.url.startsWith('/api/uploads')) {
    console.log('File request:', req.url);
  }
  next();
});

// serve uploaded files
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));

// mount upload route
const uploadRoutes = require('./routes/uploadRoutes')
app.use('/api/uploads', uploadRoutes)

// routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// expose runtime feature flags to clients
app.get('/api/config', (req, res) => {
  res.json({
    enableGpt5Mini: String(process.env.ENABLE_GPT5_MINI || '').toLowerCase() === 'true',
  });
});

app.get('/', (req, res) => res.send('Realtime Chat Server is running'));

// error handler
app.use(errorMiddleware);

// connect db and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // initialize socket handlers
  initSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = { app, server, io };