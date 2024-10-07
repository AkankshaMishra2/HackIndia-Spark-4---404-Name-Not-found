const mongoose = require('mongoose');

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/admin";

// Improved connection function
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

// User schema without validation
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  email: {
    type: String,
    unique: true,
  },
  skills: [String], // Skills array without required validation
  experience: String,
  bio: String,
  status: String,
  college: {
    type: String,
    trim: true
  },
  tier: {
    type: String,
    default: 'copper'
  },
  wallet: {
    type: Number,
    default: 0
  }
}, 
{
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Message schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create and export the models
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = {
  connectDB,
  User,
  Message
};