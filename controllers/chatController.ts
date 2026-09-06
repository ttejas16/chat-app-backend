import { type Request, type Response } from "express";
import { io } from "../socket.js";
import { prisma } from "../utils/database.js";
import { RoomType } from "../generated/prisma/enums.js";

async function addRoom(req: Request, res: Response) {
  const userId = req.body.userId; // id of user who creates a room/chat/group
  const participantIds = req.body.participants; // array of id(user)
  const isGroup = req.body.isGroup;
  const roomName = req.body.roomName || "";

  if (!userId || !participantIds || participantIds.length == 0) {
    res.status(400).json({ success: false, msg: "Can Not Add Rooms!" });
    return;
  }

  let privateRoomName = "";

  const user = await prisma.user.findUnique({
    where: {
      id: participantIds[0],
    },
    select: { id: true, name: true, avatar: true },
  });

  if (!user) {
    res.status(404).json({ success: false, msg: "Can not find user " });
    return;
  }

  let room;

  if (!isGroup) {
    const dmKey = [userId, participantIds[0]]
      .map((k) => k.toLowerCase())
      .join(":");

    room = await prisma.room.upsert({
      where: { dmKey },
      update: { dmKey },
      create: {
        type: RoomType.DM,
        creatorId: userId,
        dmKey: dmKey,
      },
    });

    // set opposite user's name
    privateRoomName = user.name;
  } else {
    room = await prisma.room.create({
      data: {
        type: RoomType.GROUP,
        name: roomName,
        creatorId: userId,
        members: {
          connect: participantIds.map((id: string) => {
            return { id };
          }),
        },
      },
    });
  }

  if (!room) {
    res.status(400).json({ success: false, msg: "Failed To Create Chat" });
    return;
  }

  const resRoom = {
    id: room.id,
    isGroup,
    roomName: isGroup ? room.name : privateRoomName,
    targetUserId: !isGroup ? user.id : null,
    avatar: !isGroup ? user.avatar : null,
    isOnline: !isGroup ? io.sockets.adapter.rooms.has(user.id) : null,
    lastMessage: null,
  };
  res.status(200).json({ success: true, msg: "Created A Room", room: resRoom });
}

async function searchUsers(req: Request, res: Response) {
  const email = req.body.email;

  if (!email) {
    res.status(400).json({ success: false, msg: "Please Provide Details" });
    return;
  }

  const result = await prisma.user.findMany({
    where: {
      email: email,
    },
    select: { id: true, name: true },
    take: 10,
  });

  if (result.length == 0) {
    res.status(200).json({ success: true, msg: "No Users Found!", users: [] });
    return;
  }

  res.json({ success: true, msg: "Users Found", users: result });
}

async function getRoomList(req: Request, res: Response) {
  const userId = req.body.userId;

  //check if refrence id is provided or not
  if (!userId) {
    res.status(400).json({ success: false, msg: "Chats Not Found!" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // check if such user exists
  if (!user) {
    res.status(401).json({ success: false, msg: "Unauthorised" });
    return;
  }

  let userRooms = await prisma.roomMember.findMany({
    where: { userId: user.id },
    include: {
      room: {
        include: {
          members: {
            where: {
              userId: { not: user.id },
            },
            select: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          messages: {
            select: {
              sender: { select: { name: true, id:true } },
              content: true
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  let rooms = userRooms.map(({room}) => {
    let roomName = room.name;
    let targetUserId = null;
    let avatar = null;

    // room.Messages will exist because we are JOINING the message table
    // message.User will also exist because the same we are joining Message with User on id
    let lastMessage = room.messages.map((msg) => {
      return {
        content: msg.content,
        user: {
          id: msg.sender.id,
          userName: msg.sender.name,
        },
      };
    });

    if (room.type == RoomType.DM) {
      room.members.forEach(({ user:u }) => {
        if (u.id !== user.id) {
          roomName = u.name;
          avatar = u.avatar;
          targetUserId = u.id;
        }
      });
    }

    return {
      id: room.id,
      isGroup: room.type == RoomType.GROUP,
      roomName: roomName,
      targetUserId: targetUserId,
      avatar: avatar,
      lastMessage: lastMessage.length != 0 ? lastMessage[0] : null,
    };
  });

  res.status(200).json({ success: true, msg: "Found Rooms", rooms: rooms });
}

async function addMessage(req: Request, res: Response) {
  const userId = req.body.userId;
  const roomId = req.body.roomId;

  if (!roomId || !userId) {
    res.status(400).json({ success: false, msg: "Can Not Add Message" });
    return;
  }

  try {
    const _ = await prisma.message.create({
      data: {
        content: "hello hello test from luffy",
        roomId,
        senderId: userId,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, msg: "Something Went Wrong!" });
    return;
  }

  res.status(200).json({ success: true, msg: "Message Sent" });
}

async function getMessages(req: Request, res: Response) {
  const roomId = req.body.roomId;

  //check if room refrence id is provided or not
  if (!roomId) {
    res.status(400).json({ success: false, msg: "Chats Not Found!" });
    return;
  }

  const result = await prisma.message.findMany({
    where: {
      roomId: roomId,
    },
    select: {
      roomId: true,
      senderId: true,
      content: true,
      sender: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (!result.length) {
    res.status(200).json({
      success: true,
      msg: "No Messages For Specified Room",
      messages: [],
    });
    return;
  }

  let messages = result.map((msg, index) => {
    // message.User will also exist because the same we are joining Message with User on id
    return {
      content: msg.content,
      userId: msg.senderId,
      roomId: msg.roomId,
      userName: msg.sender.name,
    };
  });
  messages = messages.reverse();

  res
    .status(200)
    .json({ success: true, msg: "Found Messages", messages: messages });
}

export { addRoom, getRoomList, addMessage, getMessages, searchUsers };
