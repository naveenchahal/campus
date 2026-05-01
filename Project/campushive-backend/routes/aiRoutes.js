// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const {
  summarizeNote,
  askQuestion,
  generalChat,
  getQuote,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/summarize/:id", summarizeNote); // note summarize karo
router.post("/ask", askQuestion); // note ke baare mein question
router.post("/chat", generalChat); // general AI chat
router.get("/quote", getQuote);
module.exports = router;
