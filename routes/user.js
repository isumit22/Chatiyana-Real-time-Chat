const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const router = express.Router();

// GET USER PROFILE
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // Hide password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE USER PROFILE
router.put("/:id", async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
