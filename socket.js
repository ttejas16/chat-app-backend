const { Server, Socket } = require('socket.io');
const { server } = require('./server');

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
})

module.exports = { io };