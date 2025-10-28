const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
  {
    name: { type: String },
    isGroup: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    avatar: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', ChatSchema);
