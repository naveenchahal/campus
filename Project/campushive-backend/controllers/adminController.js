const User = require("../models/User");
const Note = require("../models/Note");
const Message = require("../models/Message");
const InfoPost = require("../models/InfoPost");

// ─── GET ALL USERS ───────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, degree, branch, search } = req.query;
    const filter = {};
    if (degree) filter.degree = degree;
    if (branch) filter.branch = branch;
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({
      users,
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

// ─── BLOCK / UNBLOCK USER ────────────────────────────────────
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User nahi mila" });
    if (user.role === "admin")
      return res.status(400).json({ message: "Admin ko block nahi kar sakte" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({
      message: user.isBlocked ? "User block ho gaya" : "User unblock ho gaya",
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE USER ─────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User nahi mila" });
    if (user.role === "admin")
      return res
        .status(400)
        .json({ message: "Admin ko delete nahi kar sakte" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User delete ho gaya" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET STATS ───────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalNotes, totalMessages, totalPosts] =
      await Promise.all([
        User.countDocuments({ isVerified: true }),
        Note.countDocuments(),
        Message.countDocuments({ isDeleted: false }),
        InfoPost.countDocuments(),
      ]);
    const recentUsers = await User.find({ isVerified: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email degree branch createdAt");
    const branchStats = await User.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({
      totalUsers,
      totalNotes,
      totalMessages,
      totalPosts,
      recentUsers,
      branchStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL MESSAGES (Admin) ────────────────────────────────
const getAllMessages = async (req, res) => {
  try {
    const { room, page = 1, limit = 50, showDeleted } = req.query;
    const filter = {};
    if (room) filter.room = room;
    // showDeleted=true bhejo toh deleted dikhao, warna active
    if (showDeleted === "true") {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = false;
    }
    const messages = await Message.find(filter)
      .populate("sender", "name email rollNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Message.countDocuments(filter);
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

// ─── CREATE INFO POST ────────────────────────────────────────
const createInfoPost = async (req, res) => {
  try {
    const { title, content, category, isPinned, attachmentUrl } = req.body;
    const post = await InfoPost.create({
      title,
      content,
      category,
      isPinned: isPinned || false,
      attachmentUrl: attachmentUrl || "",
      postedBy: req.user._id,
    });
    await post.populate("postedBy", "name email");
    res.status(201).json({ message: "Post create ho gaya!", post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── MAKE ADMIN ──────────────────────────────────────────────
const makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User nahi mila" });
    res.json({ message: `${user.name} ab admin hai!`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getStats,
  getAllMessages,
  createInfoPost,
  makeAdmin,
};
