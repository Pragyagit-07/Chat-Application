const mongoose = require('mongoose');

// MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/chatApp'; // Change the URI if you're using a cloud MongoDB service like Atlas

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
