// routes/infoRoutes.js
const express = require("express");
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} = require("../controllers/infoController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getPosts);
router.get("/:id", getPostById);

// Admin only
router.post("/", adminOnly, createPost);
router.put("/:id", adminOnly, updatePost);
router.delete("/:id", adminOnly, deletePost);

module.exports = router;
