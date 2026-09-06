import { Router } from "express";
import * as chatController from "../controllers/chatController.js";

const chatRouter = Router();

chatRouter.post("/searchUsers", chatController.searchUsers);

chatRouter.post("/addRoom", chatController.addRoom);
chatRouter.post("/getRooms", chatController.getRoomList);

chatRouter.post("/addMessage", chatController.addMessage);
chatRouter.post("/getMessages", chatController.getMessages);

export default chatRouter;