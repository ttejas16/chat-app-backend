import { type Request, type Response } from "express";
import {
  createMessage,
  createRoom,
  getMessages,
  getRooms,
  getUsers,
} from "./room.service.js";

export async function addRoomsController(req: Request, res: Response) {
  const userId = req.body.userId; // id of user who creates a room/chat/group
  const participantIds = req.body.participants; // array of id(user)
  const isGroup = req.body.isGroup;
  const roomName = req.body.roomName || "";

  const result = createRoom(userId, participantIds, isGroup, roomName);

  res.status(200).json({ success: true, msg: "Created A Room", room: result });
}

export async function getRoomsController(req: Request, res: Response) {
  const userId = req.body.userId;

  const rooms = getRooms(userId);

  res.status(200).json({ success: true, msg: "Found Rooms", rooms });
}

export async function addMessagesController(req: Request, res: Response) {
  const userId = req.body.userId;
  const roomId = req.body.roomId;

  const message = createMessage(userId, roomId);

  res.status(200).json({ success: true, msg: "Message Sent" });
}

export async function getMessagesController(req: Request, res: Response) {
  const roomId = req.body.roomId;

  const messages = getMessages(roomId);

  res
    .status(200)
    .json({ success: true, msg: "Found Messages", messages: messages });
}

export async function getUsersController(req: Request, res: Response) {
  const email = req.body.email;

  const users = getUsers(email);

  res.json({ success: true, msg: "Users Found", users });
}
