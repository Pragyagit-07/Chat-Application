const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    currentRoom: {
        type: String,
        ref:'Room',
        default: ''
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
