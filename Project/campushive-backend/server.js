// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");
const connectCloudinary = require("./config/cloudinary");

// Routes
const authRoutes = require("./routes/authRoutes");
const notesRoutes = require("./routes/notesRoutes");
const chatRoutes = require("./routes/chatRoutes");
const infoRoutes = require("./routes/infoRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const httpServer = http.createServer(app);

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "campushive02y.netlify.app",
];

// ✅ CORS OPTIONS (dynamic)
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, postman etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// ✅ APPLY CORS FIRST (VERY IMPORTANT)
app.use(cors(corsOptions));
app.use(cors(corsOptions)); // 🔥 preflight fix

app.use(express.json());

// ✅ Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ DB + Cloudinary
connectDB();
connectCloudinary();

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/info", infoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "CampusHive API running 🚀" });
});

// ✅ Socket logic
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ room, userId, name }) => {
    socket.join(room);
    onlineUsers.set(socket.id, { userId, name, room });
    console.log(`${name} joined room: ${room}`);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

// ✅ make io available in controllers
app.set("io", io);

// ✅ Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
