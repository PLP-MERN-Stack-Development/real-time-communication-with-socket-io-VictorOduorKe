const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date },
    avatar: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
