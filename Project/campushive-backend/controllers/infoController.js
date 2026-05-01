// controllers/infoController.js
const InfoPost = require("../models/InfoPost");

// ─── CREATE POST (Admin only) ────────────────────────────────
const createPost = async (req, res) => {
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

    res.status(201).json({
      message: "Post create ho gaya!",
      post,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL POSTS ───────────────────────────────────────────
const getPosts = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const posts = await InfoPost.find(filter)
      .populate("postedBy", "name email")
      .sort({ isPinned: -1, createdAt: -1 }) // pinned pehle, phir latest
      .skip(skip)
      .limit(Number(limit));

    const total = await InfoPost.countDocuments(filter);

    res.json({
      posts,
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

// ─── GET SINGLE POST ─────────────────────────────────────────
const getPostById = async (req, res) => {
  try {
    const post = await InfoPost.findById(req.params.id).populate(
      "postedBy",
      "name email",
    );

    if (!post) {
      return res.status(404).json({ message: "Post nahi mila" });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── UPDATE POST (Admin only) ────────────────────────────────
const updatePost = async (req, res) => {
  try {
    const { title, content, category, isPinned, attachmentUrl } = req.body;

    const post = await InfoPost.findByIdAndUpdate(
      req.params.id,
      { title, content, category, isPinned, attachmentUrl },
      { new: true, runValidators: true },
    ).populate("postedBy", "name email");

    if (!post) {
      return res.status(404).json({ message: "Post nahi mila" });
    }

    res.json({ message: "Post update ho gaya", post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE POST (Admin only) ────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await InfoPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post nahi mila" });
    }

    res.json({ message: "Post delete ho gaya" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getPosts, getPostById, updatePost, deletePost };
