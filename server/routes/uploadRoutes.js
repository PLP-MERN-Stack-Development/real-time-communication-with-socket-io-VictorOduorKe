const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const multer = require('multer')
const path = require('path')
const { uploadFile } = require('../controllers/uploadController')

// ensure uploads directory exists and configure multer storage
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

router.post('/', upload.single('file'), uploadFile)

module.exports = router
