// middleware/uploadMiddleware.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // File type check
    const allowedFormats = [
      "pdf",
      "jpg",
      "jpeg",
      "png",
      "doc",
      "docx",
      "ppt",
      "pptx",
    ];
    const ext = file.originalname.split(".").pop().toLowerCase();

    if (!allowedFormats.includes(ext)) {
      throw new Error("Sirf PDF, Images, Word, PPT allowed hain");
    }

    const isPDF = ext === "pdf";

    return {
      folder: `campushive/notes/${req.user.degree}/${req.user.semester}/${req.user.branch}`,
      resource_type: isPDF ? "raw" : "image",
      type: "upload",
      public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

module.exports = upload;
