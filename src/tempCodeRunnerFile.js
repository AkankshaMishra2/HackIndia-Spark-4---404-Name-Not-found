app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Serve static files
// app.use(express.static('public'));  // Add this line to serve frontend files (HTML, CSS, etc.)

// // Socket.io Logic
// io.on('connection', (socket) => {
//   console.log('New user connected');

//   // Handle sending and receiving messages
//   socket.on('sendMessage', (message) => {
//     io.emit('newMessage', message);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });

// // Your database setup (if using MongoDB or SQL)
// // Your existing database code here (e.g., MongoDB connection)

// // Start the server
// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
