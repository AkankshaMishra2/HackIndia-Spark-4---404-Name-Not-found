// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const { connectDB, User, Message } = require('./config');
const http = require('http');
const socketIO = require('socket.io');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB().catch(err => console.error('Failed to connect to MongoDB:', err));

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Middleware to log requested URLs
app.use((req, res, next) => {
    console.log(`Requested URL: ${req.url}`);
    next();
});

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};


// API routes

// Signup route
app.post("/api/signup", async (req, res) => {
    const { name, password, email, skills, experience, bio, status, college } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            name,
            password: hashedPassword,
            email,
            skills: Array.isArray(skills) ? skills : [skills],
            experience,
            bio,
            status,
            college,
            tier: 'copper', // Set default tier to copper
        });

        await newUser.save();

        req.session.userId = newUser._id;

        res.status(201).json({ 
            message: "User created successfully", 
            user: {
                name: newUser.name,
                email: newUser.email,
                tier: newUser.tier,
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
});

// Login route
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid password" });
        }

        req.session.userId = user._id;

        res.json({
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email,
                tier: user.tier,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Error during login", error: error.message });
    }
});

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Could not log out, please try again" });
        }
        res.clearCookie('connect.sid');
        return res.json({ message: "Logged out successfully" });
    });
});

// Get user profile
app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            user: {
                name: user.name,
                email: user.email,
                skills: user.skills,
                experience: user.experience,
                bio: user.bio,
                status: user.status,
                college: user.college,
                tier: user.tier || 'copper',
                wallet: user.wallet
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Error fetching user data", error: error.message });
    }
});

// Get all profiles
app.get("/api/profiles", async (req, res) => {
    try {
        const profiles = await User.find({}, 'name email skills experience bio status college tier');
        res.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ message: "Error fetching profiles", error: error.message });
    }
});

// Update user data
app.put("/api/user/update", isAuthenticated, async (req, res) => {
    const { name, skills, experience, bio, status, college } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { name, skills, experience, bio, status, college },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User updated successfully",
            user: {
                name: user.name,
                email: user.email,
                skills: user.skills,
                experience: user.experience,
                bio: user.bio,
                status: user.status,
                college: user.college,
                tier: user.tier,
                wallet: user.wallet
            }
        });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: "Error updating user data", error: error.message });
    }
});


// Catch-all route to serve the frontend for any other requests
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/public', 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
});

// Error handling middleware (should be at the bottom)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});