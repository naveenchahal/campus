// routes/notesRoutes.js
const express = require("express");
const router = express.Router();
const {
  uploadNote,
  getNotes,
  getNoteById,
  deleteNote,
  likeNote,
} = require("../controllers/notesController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Saare notes routes protected hain
router.use(protect);

router.get("/", getNotes);
router.post("/", upload.single("file"), uploadNote);
router.get("/:id", getNoteById);
router.delete("/:id", deleteNote);
router.put("/:id/like", likeNote);

module.exports = router;
