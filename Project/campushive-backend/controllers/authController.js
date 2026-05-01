const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ─── REGISTER ───────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, degree, semester, branch, rollNumber } =
      req.body;

    // College email check
    if (!email.endsWith("@nitkkr.ac.in")) {
      return res
        .status(400)
        .json({ message: "Sirf @nitkkr.ac.in email allowed hai" });
    }

    // Already registered?
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "Email already registered hai" });
    }

    // Delete unverified user
    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ email });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      degree,
      semester,
      branch,
      rollNumber,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send email (SAFE)
    try {
      await sendEmail({
        to: email,
        subject: "CampusHive - Email Verify Karo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
            <h2 style="color: #f5a623;">CampusHive 🎓</h2>
            <p>Hey ${name}! Welcome to CampusHive.</p>
            <p>Tera OTP hai:</p>
            <h1 style="color: #f5a623; letter-spacing: 8px;">${otp}</h1>
            <p style="color: #888;">10 minutes mein expire ho jaayega.</p>
          </div>
        `,
      });
      console.log("OTP email sent ✅");
    } catch (err) {
      console.log("Email failed ❌:", err.message);
    }

    res.status(201).json({
      message:
        "User registered successfully. OTP email bheja gaya (agar email service kaam kare).",
      email,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── VERIFY OTP ─────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User nahi mila" });
    }

    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "OTP galat hai ya expire ho gaya" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: "Email verify ho gaya! 🎉",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        degree: user.degree,
        semester: user.semester,
        branch: user.branch,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── RESEND OTP ─────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User nahi mila" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified hai" });
    }

    const otp = user.generateOTP();
    await user.save();

    // SAFE email send
    try {
      await sendEmail({
        to: email,
        subject: "CampusHive - Naya OTP",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>CampusHive 🎓</h2>
            <p>Tera naya OTP hai:</p>
            <h1>${otp}</h1>
          </div>
        `,
      });
      console.log("Resend OTP email sent ✅");
    } catch (err) {
      console.log("Resend OTP failed ❌:", err.message);
    }

    res.json({
      message: "Naya OTP generate ho gaya (email bhejne ki koshish ki gayi)",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── LOGIN ──────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email aur password dono daalo" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Email ya password galat hai" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Pehle email verify karo" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ya password galat hai" });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful! 🎉",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        degree: user.degree,
        semester: user.semester,
        branch: user.branch,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET PROFILE ────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PROTECT MIDDLEWARE ─────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Login karo pehle" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: "User nahi mila" });
    }

    if (req.user.isBlocked) {
      return res.status(403).json({
        message: "Tera account block hai — admin se contact karo",
      });
    }

    next();
  } catch {
    res.status(401).json({ message: "Token invalid hai" });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  protect,
};
