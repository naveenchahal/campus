// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Header se token lo
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Login karo pehle" });
    }

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User dhoondo
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: "User nahi mila" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalid hai" });
  }
};

// Sirf admin ke liye
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Sirf admin kar sakta hai yeh" });
  }
  next();
};

module.exports = { protect, adminOnly };
