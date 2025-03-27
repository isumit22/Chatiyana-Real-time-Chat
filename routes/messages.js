const express = require("express");
const Message = require("../models/message");
const router = express.Router();

// ✅ Debugging logs
console.log("✅ Message routes loaded");

// ✅ Fetch Messages Route
router.get("/:senderId/:receiverId", async (req, res) => {
  console.log("📩 Fetching messages for:", req.params.senderId, "and", req.params.receiverId);
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Send Message Route
router.post("/send", async (req, res) => {
  console.log("📩 Incoming message data:", req.body);
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    res.status(201).json({ success: true, message: "Message sent!", data: newMessage });
  } catch (error) {
    console.error("❌ Error in sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
