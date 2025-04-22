const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
     content: {
         type: String,
      required: true
     },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
    
});


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
