const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getStats,
  getAllMessages,
  createInfoPost,
  makeAdmin,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.put("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/make-admin", makeAdmin);
router.get("/messages", getAllMessages);
router.post("/info", createInfoPost);

module.exports = router;
