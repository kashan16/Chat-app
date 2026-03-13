const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  username: { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ['message', 'system', 'image'],
      default: 'message',
    },
    reactions: { type: [reactionSchema], default: [] },
    editedAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
