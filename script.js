const socket = io("http://localhost:5001"); // Update with your backend URL

socket.on("receiveMessage", (data) => {
    displayMessage(data.message, "received");
});

function sendMessage() {
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value.trim();

    if (message !== "") {
        socket.emit("sendMessage", { message });
        displayMessage(message, "sent");
        messageInput.value = "";
    }
}

function displayMessage(message, type) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.classList.add(type);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
