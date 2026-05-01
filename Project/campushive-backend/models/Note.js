// models/Note.js
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title zaroori hai"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: [true, "Subject zaroori hai"],
      trim: true,
    },
    degree: {
      type: String,
      enum: ["BTech", "MTech", "MCA", "BCA", "MBA", "PhD"],
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true, // Cloudinary URL
    },
    fileType: {
      type: String,
      enum: ["pdf", "image", "doc", "other"],
      default: "pdf",
    },
    publicId: {
      type: String,
      required: true, // Cloudinary public_id — delete ke liye zaroori
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index — filtering fast hogi degree+semester+branch se
noteSchema.index({ degree: 1, semester: 1, branch: 1 });

module.exports = mongoose.model("Note", noteSchema);
