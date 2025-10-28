const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

exports.createChat = async (req, res) => {
  const { name, userIds = [], isGroup = false } = req.body;

  // Ensure current user is included
  if (!userIds.includes(String(req.user._id))) {
    userIds.push(String(req.user._id));
  }

  // For private chats (non-group) with same participants, return existing chat instead of creating duplicates
  if (!isGroup) {
    // find a chat that has exactly the same users (order-independent)
    const existing = await Chat.findOne({
      isGroup: false,
      users: { $size: userIds.length, $all: userIds.map(id => id) },
    });
    if (existing) return res.status(200).json(existing);
  }

  const users = await User.find({ _id: { $in: userIds } });
  const chat = await Chat.create({ name: name || null, users: users.map(u => u._id), isGroup });
  // return populated chat
  const populated = await Chat.findById(chat._id).populate('users', 'username avatar online lastSeen');
  res.status(201).json(populated);
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate('users', 'username avatar online lastSeen')
      .populate({ path: 'latestMessage', populate: { path: 'sender', select: 'username' } })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
};

exports.getChatById = async (req, res) => {
  const chat = await Chat.findById(req.params.id).populate('users', 'username avatar online lastSeen');
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  res.json(chat);
};
