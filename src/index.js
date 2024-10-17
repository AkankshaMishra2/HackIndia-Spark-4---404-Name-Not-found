// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const socketIO = require('socket.io');
const { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } = require('@solana/web3.js');
const bodyParser = require('body-parser');
const { connectDB, User, Message, updateUserWalletAddress, getUserWalletAddress } = require('./config'); // Consolidated imports
// const { connectDB, User, updateUserWalletAddress, getUserWalletAddress } = require('./config');

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
app.use(bodyParser.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret',
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
            tier: 'copper',
            tokenCount: 0,
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
                tier: user.tier,
                walletAddress: user.walletAddress,
                tokenCount: user.tokenCount
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
        const profiles = await User.find({}, 'name email skills experience bio status college tier tokenCount');
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
                walletAddress: user.walletAddress,
                tokenCount: user.tokenCount
            }
        });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: "Error updating user data", error: error.message });
    }
});

// Check login status
app.get("/api/user/check-login", (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});


// Update user's wallet address
app.post('/api/user/update-wallet', isAuthenticated, async (req, res) => {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
  
    try {
      await updateUserWalletAddress(req.session.userId, walletAddress);
      res.json({ message: 'Wallet address updated successfully' });
    } catch (error) {
      console.error('Error updating wallet address:', error);
      res.status(500).json({ message: 'Failed to update wallet address', error: error.message });
    }
  });

// Get user's wallet address
app.get('/api/user/:userId/wallet-address', async (req, res) => {
    const { userId } = req.params;

    try {
        const walletAddress = await getUserWalletAddress(userId);
        if (!walletAddress) {
            return res.status(404).json({ error: 'Wallet address not found' });
        }
        res.json({ walletAddress });
    } catch (error) {
        console.error('Error fetching wallet address:', error);
        res.status(500).json({ error: 'Failed to fetch wallet address' });
    }
});

// Update user's token count
app.post("/api/user/update-tokens", isAuthenticated, async (req, res) => {
    const { profileId, amount } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            profileId,
            { $inc: { tokenCount: amount } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newTier = calculateTier(user.tokenCount);
        if (newTier !== user.tier) {
            user.tier = newTier;
            await user.save();
        }

        res.json({
            message: "Token count updated successfully",
            user: {
                name: user.name,
                email: user.email,
                tokenCount: user.tokenCount,
                tier: user.tier
            }
        });
    } catch (error) {
        console.error('Error updating token count:', error);
        res.status(500).json({ message: "Error updating token count", error: error.message });
    }
});

function calculateTier(tokenCount) {
    if (tokenCount >= 1000) return 'legendary';
    if (tokenCount >= 500) return 'titanium';
    if (tokenCount >= 250) return 'platinum';
    if (tokenCount >= 100) return 'gold';
    if (tokenCount >= 50) return 'silver';
    if (tokenCount >= 25) return 'bronze';
    return 'copper';
}

// WebSocket connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('send-message', (message) => {
        io.emit('receive-message', message); // Broadcast message to all connected users
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Airdrop tokens to a user
app.post("/api/airdrop", isAuthenticated, async (req, res) => {
    const { amount } = req.body;

    try {
        const user = await User.findById(req.session.userId);
        if (!user || !user.walletAddress) {
            return res.status(400).json({ message: "User not found or wallet not connected" });
        }

        const connection = new Connection("https://api.devnet.solana.com");
        const publicKey = new PublicKey(user.walletAddress);

        const signature = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);

        user.tokenCount += parseFloat(amount);
        await user.save();

        const newTier = calculateTier(user.tokenCount);
        if (newTier !== user.tier) {
            user.tier = newTier;
            await user.save();
        }

        res.json({
            message: "Airdrop successful",
            signature,
            newBalance: user.tokenCount,
            newTier: user.tier
        });
    } catch (error) {
        console.error('Airdrop error:', error);
        res.status(500).json({ message: "Error during airdrop", error: error.message });
    }
});

// Send tokens
app.post("/api/send-tokens", isAuthenticated, async (req, res) => {
    const { amount, recipientAddress } = req.body;

    try {
        const sender = await User.findById(req.session.userId);
        if (!sender || !sender.walletAddress) {
            return res.status(400).json({ message: "Sender not found or wallet not connected" });
        }

        const connection = new Connection("https://api.devnet.solana.com");
        const senderPublicKey = new PublicKey(sender.walletAddress);
        const recipientPublicKey = new PublicKey(recipientAddress);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderPublicKey,
                toPubkey: recipientPublicKey,
                lamports: amount * LAMPORTS_PER_SOL
            })
        );

        // Get the latest blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = senderPublicKey;

        // Sign the transaction (this should be done client-side in a real application)
        // For demonstration purposes, we're using a dummy private key here
        // In a real application, the user would sign this with their wallet
        const dummyPrivateKey = "dummy_private_key";
        const signedTransaction = await Transaction.sign([dummyPrivateKey], transaction);

        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature);

        // Update sender's token count
        sender.tokenCount -= parseFloat(amount);
        await sender.save();

        res.json({
            message: "Tokens sent successfully",
            signature,
            newBalance: sender.tokenCount
        });
    } catch (error) {
        console.error('Error sending tokens:', error);
        res.status(500).json({ message: "Error sending tokens", error: error.message });
    }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`${new Date().toISOString()} - Error:`, err);
    res.status(500).send('Something broke!');
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});