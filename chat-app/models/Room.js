const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    users: [{
        type: String,
        ref: 'User'
    }],
    messages: [{
        type: String,
        username: String,
        message: String,
        content: String,
        timestamp: Date,
        ref: 'Message'
    }]
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
