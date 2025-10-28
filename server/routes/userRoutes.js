const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const multer = require('multer')
const path = require('path')
const { getUsers, updateProfile, getMe } = require('../controllers/userController')

// light-weight multer storage for avatar uploads (reuse server/uploads)
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '..', 'uploads'))
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname)
		const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
		cb(null, name)
	}
})
const upload = multer({ storage })

router.use(auth)

router.get('/', getUsers)
router.get('/me', getMe)
router.put('/me', upload.single('avatar'), updateProfile)

module.exports = router
