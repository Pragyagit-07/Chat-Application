 let socket = new WebSocket('ws://localhost:5000');  // Change URL if needed
let username = '';
let currentRoom = '';

// User Authentication
document.getElementById('set-username-btn').addEventListener('click', () => {
    const input = document.getElementById('username').value;
    if (input.trim()) {
        username = input.trim().toLowerCase();
        document.getElementById('username-modal').style.visibility = 'hidden';
        socket.send(JSON.stringify({ type: 'set-username', username }));
        
       
        

         // Display Welcome Message on the Chat
         const welcomeMessage = `Welcome ${username}  !`;
         displayMessage('Server', welcomeMessage, new Date().toLocaleTimeString());
    }
});

document.getElementById('username-modal').style.visibility = 'visible';

// WebSocket events
function connectWebSocket() {
socket.onopen = () => {
    console.log('Connected to WebSocket');
};


socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);  // Debugging line
    switch (message.type) {
        case 'room-list':
            updateRoomList(message.rooms);
            break;
        case 'new-message':
            console.log('Displaying message on screen:', message);
            notifyNewMessage(message.username, message.content);
            displayMessage(message.username, message.content, message.timestamp);
            break;
        case 'user-joined':
            console.log(`${message.username} has joined the room.`);
            displayMessage('Server', `${message.username} has joined the room.`, new Date().toLocaleTimeString());
           
            break;
        case 'user-left':
            console.log(`${message.username} has left the room.`);
            displayMessage('Server', `${message.username} has left the room.`, new Date().toLocaleTimeString());
            
            break;
    }
};
socket.onclose = (event) => {
    console.log('WebSocket closed. Reconnecting...', event);
    setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
};
socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket.close();  // Try to close and reconnect
};
}
 connectWebSocket();  // Initial Websocket connection

// Room Management
document.getElementById('create-room-btn').addEventListener('click', () => {
    const roomName = prompt('Enter room name:')?.trim().toLowerCase();
    if (roomName && username) {
        socket.send(JSON.stringify({ type: 'create-room', roomName }));
    } else {
        alert('Please enter a valid room name and username.');
    }
});
// Join Room
function joinRoom(roomName) {
    if (currentRoom) {
        socket.send(JSON.stringify({ type: 'leave-room', room: currentRoom, username }));
    }
    currentRoom = roomName.trim().toLowerCase();
    socket.send(JSON.stringify({ type: 'join-room', roomName: currentRoom, username }));
}

// Message Handling
document.getElementById('send-btn').addEventListener('click', () => {
    const messageContent = document.getElementById('message-input').value;
    if (messageContent.trim() && currentRoom) {
        console.log(`Sending message to room ${currentRoom}: ${messageContent}`);
  displayMessage(  currentRoom, messageContent,new Date().toLocaleTimeString());
        socket.send(JSON.stringify({ type: 'send-message',  content: messageContent }));
        document.getElementById('message-input').value = '';//clear input
    }else {
        alert('Please enter a message and join a room.');
    }
});
// Capitalize the first letter of a word
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
//Display message with formatting
function displayMessage(username, content, timestamp) {

    const messageList = document.getElementById('message-list');
    if (!messageList) {
        console.error('Message list container not found!');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    // This allows for basic text formatting (bold, italics, and links)
    const formattedContent = formatMessageContent(content);
    // Capitalize username for display
    const displayUsername = capitalize(username);
    messageDiv.innerHTML = `<strong>${capitalize(username)}</strong>: ${formattedContent} <span class="timestamp">${timestamp}</span>`;

   
    messageList.appendChild(messageDiv);
  
    
      
    // Ensure auto-scrolling to the latest message
    autoScroll();
   
}
// Function to format the message content (handles bold, italics, and links)
function formatMessageContent(content) {
    // Convert **bold** to <strong>...</strong>
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert *italic* to <em>...</em>
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert URLs to clickable links
    content = content.replace(/https?:\/\/[^\s]+/g, (url) => `<a href="${url}" target="_blank">${url}</a>`);
    
    return content;
}
// Auto-scrolling logic
function autoScroll() {
    const messageList = document.getElementById('message-list');
    const isScrolledToBottom = messageList.scrollHeight - messageList.clientHeight <= messageList.scrollTop + 1;

    if (isScrolledToBottom) {
        messageList.scrollTop = messageList.scrollHeight;
    }
}
// Update the room list UI
function updateRoomList(rooms) {
    const roomList = document.getElementById('rooms');
    roomList.innerHTML = ''; // Clear the list first
    rooms.forEach(room => {
        const roomItem = document.createElement('li');
        roomItem.textContent = room;
        roomItem.addEventListener('click', () => joinRoom(room));
        roomList.appendChild(roomItem);
    });
     // Now that room list updated, add event listeners for selecting rooms
     
     const roomItems = document.querySelectorAll('.room-list ul li');

     roomItems.forEach(function(item) {
         item.addEventListener('click', function() {
             // Remove the 'selected' class from all room items
             roomItems.forEach(function(room) {
                 room.classList.remove('selected');
             });

             // Add the 'selected' class to the clicked room item
             item.classList.add('selected');
         });
     });
}


// Function to notify user about new messages
function notifyNewMessage(username, content) {
    if (document.hidden) {  // Check if the window is hidden (minimized, in the background)
        const notification = new Notification(`${username} says: ${content}`);
    }
}
// Browser Notification Permission
if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}



