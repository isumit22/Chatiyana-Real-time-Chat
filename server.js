const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");
const Message = require("./models/message");
const http = require("http");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const messageRoutes = require("./routes/messages");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Store active users
let onlineUsers = {};

// ✅ Ensure `io` is defined before using it
io.on("connection", (socket) => {
  console.log(`🔵 User Connected: ${socket.id}`);

  socket.on("join", async (userData) => {
    const { userId, username } = userData;
    onlineUsers[userId] = { socketId: socket.id, username };

    console.log(`✅ User ${username} (${userId}) is online`);

    try {
      // Fetch previous messages for this user
      const messages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
      }).sort({ createdAt: 1 });

      // Send all previous messages to the user
      socket.emit("previousMessages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  });

  socket.on("sendMessage", async (data) => {
    const { sender, receiver, message } = data;
    console.log(`📩 Message from ${sender} to ${receiver}: ${message}`);

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    if (onlineUsers[receiver]) {
      io.to(onlineUsers[receiver].socketId).emit("receiveMessage", newMessage);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User Disconnected: ${socket.id}`);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId].socketId === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
  });
});

// ✅ Move MongoDB connection setup here
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,  // Add timeout
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ✅ Start the server after setting up everything
server.listen(5001, () => {
  console.log("🚀 Server running on port 5001");
});
