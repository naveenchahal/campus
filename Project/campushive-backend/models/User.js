// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name zaroori hai"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email zaroori hai"],
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@nitkkr\.ac\.in$/,
        "Sirf @nitkkr.ac.in email allowed hai",
      ],
    },
    password: {
      type: String,
      required: [true, "Password zaroori hai"],
      minlength: 6,
      select: false, // password kabhi bhi query mein nahi aayega by default
    },
    degree: {
      type: String,
      enum: ["BTech", "MTech", "MCA", "BCA", "MBA", "PhD"],
      required: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    branch: {
      type: String,
      enum: [
        "CSE",
        "ECE",
        "EE",
        "ME",
        "CE",
        "IT",
        "PIE",
        "COE",
        "CSBS",
        "General",
      ],
      required: true,
    },
    rollNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    avatar: {
      type: String,
      default: "",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto add hoga
  },
);

// Password save karne se pehle hash karo
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Password compare karne ka method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// OTP generate karne ka method
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min valid
  };
  return otp;
};

// OTP verify karne ka method
userSchema.methods.verifyOTP = function (enteredOTP) {
  if (!this.otp.code) return false;
  if (this.otp.expiresAt < new Date()) return false; // expire ho gaya
  return this.otp.code === enteredOTP;
};

module.exports = mongoose.model("User", userSchema);
