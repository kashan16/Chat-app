const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    color: {
      type: String,
      default: () => {
        const colors = ['#7c6fff', '#ff6b9d', '#00d9ff', '#ffd166', '#06d6a0', '#ff9f1c', '#a8dadc'];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
