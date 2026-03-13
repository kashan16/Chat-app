const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
  {
    // Canonical conversation ID: sorted usernames joined by ":"
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

directMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
