// controllers/chatController.js
const Message = require("../models/Message");

// ─── GET MESSAGES (Room ke saare messages) ──────────────────
const getMessages = async (req, res) => {
  try {
    const { room } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      room,
      isDeleted: false,
    })
      .populate("sender", "name email degree branch semester")
      .sort({ createdAt: 1 }) // purane pehle
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments({ room, isDeleted: false });

    res.json({
      messages,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── SAVE MESSAGE (Socket se call hoga) ─────────────────────
const saveMessage = async (req, res) => {
  try {
    const { room, content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Message empty nahi ho sakta" });
    }

    const message = await Message.create({
      room,
      content: content.trim(),
      sender: req.user._id,
      senderName: req.user.name,
    });

    await message.populate("sender", "name email degree branch semester");

    // Socket.io se real time broadcast
    const io = req.app.get("io");
    io.to(room).emit("receive_message", message);

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE MESSAGE (Admin only) ────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message nahi mila" });
    }

    // Apna message ya admin — dono delete kar sakte hain
    if (
      message.sender.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Permission nahi hai" });
    }

    message.isDeleted = true;
    message.deletedBy = req.user._id;
    await message.save();

    // Socket se sabko batao message delete hua
    const io = req.app.get("io");
    io.to(message.room).emit("message_deleted", { messageId: message._id });

    res.json({ message: "Message delete ho gaya" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL ROOMS (Admin — sabke rooms dekh sakta hai) ──────
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Message.distinct("room");
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET FLAGGED MESSAGES (Admin moderation) ────────────────
const getFlaggedMessages = async (req, res) => {
  try {
    // Last 24 hours ke deleted messages
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const messages = await Message.find({
      isDeleted: true,
      updatedAt: { $gte: since },
    })
      .populate("sender", "name email rollNumber")
      .populate("deletedBy", "name role")
      .sort({ updatedAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  saveMessage,
  deleteMessage,
  getAllRooms,
  getFlaggedMessages,
};
