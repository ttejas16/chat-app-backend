import { Router } from "express";
import {
  addMessagesController,
  addRoomsController,
  getMessagesController,
  getRoomsController,
  getUsersController,
} from "./room.controller.js";

const roomRouter = Router();

roomRouter.post("/rooms", addRoomsController);
roomRouter.get("/rooms", getRoomsController);

roomRouter.post("/rooms/message", addMessagesController);
roomRouter.get("/rooms/message", getMessagesController);

roomRouter.get("/users", getUsersController); // TODO: move this somewhere else and remove comepletely after invite feature is implemented

export default roomRouter;
