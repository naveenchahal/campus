// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMessages,
  saveMessage,
  deleteMessage,
  getAllRooms,
  getFlaggedMessages,
} = require("../controllers/chatController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/rooms/:room", getMessages); // room ke messages
router.post("/message", saveMessage); // message save + broadcast
router.delete("/message/:id", deleteMessage); // delete message

// Admin only
router.get("/admin/rooms", adminOnly, getAllRooms);
router.get("/admin/flagged", adminOnly, getFlaggedMessages);

module.exports = router;
