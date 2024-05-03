require('dotenv').config();
const http = require("http");
const port = process.env.PORT;
const logger = require('morgan');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const { sequelize } = require('./utils/database');

const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');
const Participant = require('./models/Participant');

const { verifyToken } = require('./middleware/verifyToken');
const authRouter = require("./routes/authRouter");
const chatRouter = require("./routes/chatRouter");
const initializeSocket = require("./controllers/socketController");

async function createAll() {
    try {
        await sequelize.sync()

    } catch (err) {
        console.log(err);
    }
}

createAll();

const app = express()
const server = http.createServer(app);

app.use(logger('dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(verifyToken);

app.get("/", (req, res) => {
    res.json('test');
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/chat", chatRouter);

initializeSocket(server);

app.use((req, res) => {
    res.status(404).json({ success: false, msg: "404 resource not found" });
})

server.listen(port, () => {
    console.log(`server listening on port ${port}`);
})