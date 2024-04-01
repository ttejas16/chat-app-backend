const express = require('express');
const chatRouter = express.Router();
const chatController = require("../controllers/chatController");


chatRouter.post("/searchUsers", chatController.searchUsers);

chatRouter.post("/addRoom", chatController.addRoom);
chatRouter.post("/getRooms", chatController.getRoomList);

chatRouter.post("/addMessage",chatController.addMessage);
chatRouter.post("/getMessages", chatController.getMessages);

module.exports = chatRouter;