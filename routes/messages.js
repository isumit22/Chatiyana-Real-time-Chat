const express = require("express");
const Message = require("../models/message");
const router = express.Router();

// Send Message
router.post("/send", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Messages Between Two Users
router.get("/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    // Find messages where sender/receiver match user1 and user2
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ createdAt: 1 }); // Sort by oldest first

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
