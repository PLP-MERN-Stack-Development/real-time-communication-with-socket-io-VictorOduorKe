const Message = require('../models/Message');
const Chat = require('../models/Chat');

exports.sendMessage = async (req, res) => {
  const { chatId, content, attachments = [] } = req.body;
  if (!chatId) return res.status(400).json({ message: 'chatId required' });

  const message = await Message.create({ sender: req.user._id, chat: chatId, content, attachments });

  // update latestMessage on chat
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id, updatedAt: Date.now() });

  const populated = await Message.findById(message._id).populate('sender', 'username avatar');
  res.status(201).json(populated);
};

exports.getMessages = async (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ message: 'chatId required' });

  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'username avatar')
    .sort({ createdAt: 1 });

  res.json(messages);
};

exports.markRead = async (req, res) => {
  const { messageId } = req.params;
  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ message: 'Message not found' });

  if (!msg.readBy.includes(req.user._id)) {
    msg.readBy.push(req.user._id);
    await msg.save();
  }

  res.json(msg);
};
