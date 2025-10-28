const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createChat, getChats, getChatById } = require('../controllers/chatController');

router.use(auth);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChatById);

module.exports = router;
