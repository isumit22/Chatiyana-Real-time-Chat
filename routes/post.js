const express = require("express");
const path = require("path");
const Post = require(path.join(__dirname, "../models/Post"));

const multer = require("multer");

const router = express.Router();

// Create a new post
router.post("/", async (req, res) => {
  try {
    const { userId, text, image } = req.body;
    const newPost = new Post({ userId, text, image });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate("userId", "username profilePicture");
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Like/Unlike a post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(req.body.userId)) {
      post.likes = post.likes.filter(id => id !== req.body.userId); // Unlike
    } else {
      post.likes.push(req.body.userId); // Like
    }

    await post.save();
    res.status(200).json({ message: "Post updated", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
