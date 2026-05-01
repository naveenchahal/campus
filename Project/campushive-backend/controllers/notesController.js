// controllers/notesController.js
const Note = require("../models/Note");
const cloudinary = require("cloudinary").v2;

// ─── UPLOAD NOTE ────────────────────────────────────────────
const uploadNote = async (req, res) => {
  try {
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { title, description, subject } = req.body;

    if (!subject) {
      return res
        .status(400)
        .json({ message: "Title aur subject zaroori hain" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File upload karo" });
    }

    const note = await Note.create({
      title,
      description,
      subject,
      degree: req.user.degree,
      semester: req.user.semester,
      branch: req.user.branch,
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileType:
        req.file.originalname.split(".").pop().toLowerCase() === "pdf"
          ? "pdf"
          : "image",
      uploadedBy: req.user._id,
    });

    await note.populate("uploadedBy", "name email");

    res.status(201).json({
      message: "Note upload ho gaya! 🎉",
      note,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET NOTES ──────────────────────────────────────────────
const getNotes = async (req, res) => {
  try {
    const {
      degree,
      semester,
      branch,
      subject,
      page = 1,
      limit = 10,
    } = req.query;

    // Filter banao
    const filter = {};
    if (degree) filter.degree = degree;
    if (semester) filter.semester = Number(semester);
    if (branch) filter.branch = branch;
    if (subject) filter.subject = { $regex: subject, $options: "i" }; // case insensitive search

    const skip = (page - 1) * limit;

    const notes = await Note.find(filter)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 }) // latest pehle
      .skip(skip)
      .limit(Number(limit));

    const total = await Note.countDocuments(filter);

    res.json({
      notes,
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

// ─── GET SINGLE NOTE ────────────────────────────────────────
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploadedBy",
      "name email",
    );

    if (!note) {
      return res.status(404).json({ message: "Note nahi mila" });
    }

    // Download count badhao
    note.downloads += 1;
    await note.save();

    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE NOTE ────────────────────────────────────────────
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note nahi mila" });
    }

    // Sirf uploader ya admin delete kar sakta hai
    if (
      note.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Tujhe permission nahi hai" });
    }

    // Cloudinary se bhi delete karo
    await cloudinary.uploader.destroy(note.publicId, {
      resource_type: note.fileType === "pdf" ? "raw" : "image",
    });

    await note.deleteOne();

    res.json({ message: "Note delete ho gaya" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── LIKE NOTE ──────────────────────────────────────────────
const likeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note nahi mila" });
    }

    const alreadyLiked = note.likes.includes(req.user._id);

    if (alreadyLiked) {
      // Unlike
      note.likes = note.likes.filter(
        (id) => id.toString() !== req.user._id.toString(),
      );
    } else {
      // Like
      note.likes.push(req.user._id);
    }

    await note.save();

    res.json({
      message: alreadyLiked ? "Unlike ho gaya" : "Like ho gaya",
      likes: note.likes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadNote, getNotes, getNoteById, deleteNote, likeNote };
