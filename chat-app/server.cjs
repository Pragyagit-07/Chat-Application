const WebSocket = require("ws");
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');
const connectDB = require('./db');
// Connect to MongoDB
connectDB();
const wss = new WebSocket.Server({ port: 5000});
 

  let users = {};  // { username: socket }
const rooms = {};  // { roomName: [users] }


wss.on('connection', ws => {
    console.log('WebSocket Server connected...');
    let currentUsername = null;
    let currentRoom = null;

    ws.on('message', async (message)=> {
        const msg = JSON.parse(message);
        console.log('Received message from client:', msg);  // Debugging line
        

        switch (msg.type) {
            case 'set-username':
                currentUsername = msg.username.trim().toLowerCase();
                 // Create or find the user in the database
                 let user = await User.findOne({ username: currentUsername });
                 if (!user) {
                    user = new User({ username: currentUsername });
                    await user.save();
                }
       // Save the WebSocket instance to users mapping
            
            users[currentUsername] = ws;

                break;

            case 'create-room':{
                 // Create a new room in the database
                 const normalizedRoomName = (msg.room || msg.roomName).trim().toLowerCase();
                 let room = await Room.findOne({ name: normalizedRoomName });
                
                 if (!room) {
                    room = new Room({ name: normalizedRoomName });
                    await room.save();
                }
               
               
                
                // Add room to rooms mapping
                rooms[room.name] = room.users || [];  // Keep track of the room's users
         // send the client with the updated list of rooms
         const allRooms = await Room.find({});
        ws.send(JSON.stringify({ type: 'room-list', rooms: allRooms.map(r => r.name) }));
              break;
            }

               
                

            case 'join-room':{
                const normalizedRoomName = (msg.room || msg.roomName).trim().toLowerCase();
                // Add user to the room in MongoDB
         let  roomToJoin = await Room.findOne({ name: normalizedRoomName });
                if (roomToJoin) {
                    if (!roomToJoin.users.includes(currentUsername)) {
                    roomToJoin.users.push(currentUsername);
                    await roomToJoin.save();
                    }
                    currentRoom =  roomToJoin.name;
                     // Add the room to the rooms object
                     rooms[currentRoom] = roomToJoin.users;  // Update the rooms object


                 // Send a welcome message to the user
                 ws.send(JSON.stringify({
                    type: 'new-message',
                     username: 'Server', 
                     content: 'Welcome to the chat!',
                      timestamp: new Date().toLocaleTimeString() 
                   }));
                        // Notify other users in the room
                        roomToJoin.users.forEach(username => {
                            if (username !== currentUsername ) {
                       
                        users[username]?.send(JSON.stringify({
                                type: 'user-joined',
                                username: currentUsername
                            }));
                        }
                    });
                     
                }
                break;
            }
                case 'send-message':
                    if (currentRoom) {
                        console.log(`[send-message] Saving message from ${currentUsername} in room ${currentRoom}`);
                
                        const room = await Room.findOne({ name: currentRoom });
                
                        if (room) {
                            const newMessage = new Message({
                                username: currentUsername,
                                content: msg.content,
                                room: room._id
                            });
                
                            try {
                                const saved = await newMessage.save();
                                console.log(' Message saved to MongoDB:', saved);
                
                                // Send message to everyone in the room
                                room.users.forEach(user => {
                                    const clientSocket = users[user];
                                    if (clientSocket) {
                                        clientSocket.send(JSON.stringify({
                                            type: 'new-message',
                                            username: currentUsername,
                                            content: msg.content,
                                            timestamp: new Date().toLocaleTimeString()
                                        }));
                                    }
                                });
                
                            } catch (error) {
                                console.error(' Error saving message to MongoDB:', error);
                                ws.send(JSON.stringify({
                                    type: 'error',
                                    message: 'Error saving message.'
                                }));
                            }
                        } else {
                            console.log(' Room not found:', currentRoom);
                        }
                    } else {
                        console.log('No room selected to send message.');
                    }
                    break;
                

 


            case 'leave-room':{
                const normalizedRoomName = (msg.room || msg.roomName || currentRoom)?.trim().toLowerCase();
                if (normalizedRoomName) {
                // Remove user from the room
            const room = await Room.findOne({ name: normalizedRoomName });
            
                room.users = room.users.filter(user => user !== currentUsername);
                await room.save();
                // Notify other users in the room
                room.users.forEach(username => {
                    if (username !== currentUsername && users[username]) {
                        users[username].send(JSON.stringify({
                            type: 'user-left',
                            username: currentUsername
                        }));
                    }
                });
                // Clean up server memory
            if (rooms[normalizedRoomName]) {
                rooms[normalizedRoomName] = room.users;
            }
            
            // Reset currentRoom for this user
            currentRoom = null;
        }
    }
            break;
        
    }
});


ws.on('close', () => {
    // Handle cleanup if the WebSocket connection is closed
    if (currentUsername && currentRoom) {
        const room = Room.findOne({ name: currentRoom });
        if (room) {
            room.users = room.users.filter(user => user !== currentUsername);
            room.save();
        }
    }
    // Remove WebSocket instance from users map when connection closes
    delete users[ws];
});

});




 