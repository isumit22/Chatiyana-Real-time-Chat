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
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const messageRoutes = require("./routes/messages");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Store active users with names
let onlineUsers = {}; // { userId: { socketId, username } }

socket.on("join", (userData) => {
    const { userId, username } = userData;
    onlineUsers[userId] = { socketId: socket.id, username };
    
    console.log(`✅ User ${username} (${userId}) is online`);

    // Send previous messages
    Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
    })
    .sort({ createdAt: 1 })
    .then((messages) => {
        socket.emit("previousMessages", messages);
    });
});

// Modify sendMessage event to include usernames
socket.on("sendMessage", async (data) => {
    const { sender, receiver, message } = data;
    const senderName = onlineUsers[sender]?.username || "Unknown";  // Get sender name

    console.log(`📩 ${senderName} (${sender}) to ${receiver}: ${message}`);

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    if (onlineUsers[receiver]) {
        io.to(onlineUsers[receiver].socketId).emit("receiveMessage", {
            sender,
            senderName,
            message
        });
    }
});

io.on("connection", (socket) => {
  console.log(`🔵 User Connected: ${socket.id}`);

  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`✅ User ${userId} is online`);
  });

  socket.on("sendMessage", async (data) => {
    console.log(`📩 Incoming message:`, data);  // Debugging Log

    const { sender, receiver, message } = data;

    if (!sender || !receiver || !message) {
        console.log("❌ Invalid message data!");
        return;
    }

    try {
        const newMessage = new Message({ sender, receiver, message });
        await newMessage.save();
        console.log(`✅ Message saved to DB: ${message}`);

        // Send message to receiver if online
        if (onlineUsers[receiver]) {
            io.to(onlineUsers[receiver]).emit("receiveMessage", newMessage);
            console.log(`📨 Message sent to ${receiver}`);
        }
    } catch (error) {
        console.error("❌ Error saving message:", error);
    }
});

socket.on("join", async (userId) => {
  onlineUsers[userId] = socket.id; // Store user socket ID
  console.log(`✅ User ${userId} is online`);

  // Fetch previous messages for this user
  try {
      const messages = await Message.find({
          $or: [{ sender: userId }, { receiver: userId }]
      }).sort({ createdAt: 1 }); // Sort by oldest first

      socket.emit("previousMessages", messages);
  } catch (error) {
      console.error("❌ Error fetching previous messages:", error);
  }
});

  socket.on("disconnect", () => {
    console.log(`🔴 User Disconnected: ${socket.id}`);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

server.listen(5001, () => {
  console.log("🚀 Server running on port 5001");
});
