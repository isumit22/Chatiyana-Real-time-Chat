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

// Socket.io Connection
io.on("connection", (socket) => {
  console.log(`🔵 User Connected: ${socket.id}`);

  // Handle user joining
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id; // Store user socket ID
    console.log(`✅ User ${userId} is online`);
  });

  // Handle sending messages
  socket.on("sendMessage", async (data) => {
    const { sender, receiver, message } = data;
    console.log(`📩 Message from ${sender} to ${receiver}: ${message}`);

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    // Send message to receiver if online
    if (onlineUsers[receiver]) {
      io.to(onlineUsers[receiver]).emit("receiveMessage", newMessage);
    }
  });

  // Notify typing
  socket.on("typing", ({ sender, receiver }) => {
    if (onlineUsers[receiver]) {
      io.to(onlineUsers[receiver]).emit("userTyping", { sender });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 User Disconnected: ${socket.id}`);
    // Remove user from online list
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
  });
});

server.listen(5001, () => {
  console.log("🚀 Server running on port 5001");
});
