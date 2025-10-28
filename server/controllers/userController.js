const User = require('../models/User')
const path = require('path')

exports.getUsers = async (req, res) => {
  const users = await User.find().select('-password')
  res.json(users)
}

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password')
  res.json(user)
}

exports.updateProfile = async (req, res) => {
  try {
    const updates = {}
    if (req.file) {
      // build URL
      const host = req.get('host')
      const protocol = req.protocol
      updates.avatar = `${protocol}://${host}/uploads/${req.file.filename}`
    }
    if (typeof req.body.bio !== 'undefined') updates.bio = req.body.bio

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
