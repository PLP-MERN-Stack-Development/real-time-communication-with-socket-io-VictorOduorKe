const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { sendMessage, getMessages, markRead } = require('../controllers/messageController');

router.use(auth);

router.post('/', sendMessage);
router.get('/', getMessages);
router.put('/:messageId/read', markRead);

module.exports = router;
