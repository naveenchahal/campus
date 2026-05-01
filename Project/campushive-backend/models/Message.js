// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      // Format: "BTech_3_CSE" ya "general"
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message empty nahi ho sakta"],
      maxlength: [1000, "Message 1000 characters se zyada nahi"],
    },
    isDeleted: {
      type: Boolean,
      default: false, // Admin delete karega toh true hoga
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Index — room ke messages fast fetch hone ke liye
messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
