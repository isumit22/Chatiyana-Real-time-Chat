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
