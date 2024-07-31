const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const waitingUsers = [];

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Add user to the waiting queue
  waitingUsers.push(socket);

  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();
    
    // Inform both users they've been paired
    user1.emit('paired', { peerId: user2.id });
    user2.emit('paired', { peerId: user1.id });

    // Handle signaling between the paired users
    user1.on('offer', (data) => user2.emit('offer', data));
    user2.on('answer', (data) => user1.emit('answer', data));
    user1.on('ice-candidate', (data) => user2.emit('ice-candidate', data));
    user2.on('ice-candidate', (data) => user1.emit('ice-candidate', data));
  }

  // Remove user from queue on disconnect
  socket.on('disconnect', () => {
    const index = waitingUsers.indexOf(socket);
    if (index !== -1) waitingUsers.splice(index, 1);
    console.log('User disconnected: ' + socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
