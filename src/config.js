require('dotenv').config();

const mongoose = require('mongoose');

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI ||"mongodb+srv://Akanksha_2004:Akanksha_2004@user.y470l.mongodb.net/guidex";

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
  walletAddress: {
    type: String,
    unique: true,
    sparse: true
  }
},
 
{
  timestamps: true // Adds createdAt and updatedAt timestamps
});



// Create and export the models
const User = mongoose.model('User', userSchema);


module.exports = {
  connectDB,
  User
 
};