import { RoomType } from "../../generated/prisma/enums.js";
import { io } from "../../socket.js";
import { prisma } from "../../utils/database.js";
import ApiError from "../../utils/error.js";

export async function createRoom(
  userId: string,
  participantIds: string[],
  isGroup: boolean,
  roomName: string,
) {
  if (!userId || !participantIds || participantIds.length == 0) {
    throw new ApiError(400, "Cannot add rooms. Invalid data.");
  }

  let privateRoomName = "";

  const user = await prisma.user.findUnique({
    where: {
      id: participantIds[0]!,
    },
    select: { id: true, name: true, avatar: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  let room;

  if (!isGroup) {
    const dmKey = [userId, participantIds[0]]
      .map((k) => k!.toLowerCase())
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
          create: participantIds.map((id: string) => {
            return { userId: id };
          }),
        },
      },
    });
  }

  if (!room) {
    throw new ApiError(400, "Failed to create room");
  }

  return {
    id: room.id,
    isGroup,
    roomName: isGroup ? room.name : privateRoomName,
    targetUserId: !isGroup ? user.id : null,
    avatar: !isGroup ? user.avatar : null,
    isOnline: !isGroup ? io.sockets.adapter.rooms.has(user.id) : null,
    lastMessage: null,
  };
}

export async function getRooms(userId: string) {
  //check if refrence id is provided or not
  if (!userId) {
    throw new ApiError(400, "Chats not found. Invalid request.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // check if such user exists
  if (!user) {
    throw new ApiError(401, "Unauthorized");
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
              sender: { select: { name: true, id: true } },
              content: true,
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

  return userRooms.map(({ room }) => {
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
      room.members.forEach(({ user: u }) => {
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
}

export async function createMessage(userId: string, roomId: string) {
  if (!roomId || !userId) {
    throw new ApiError(400, "Cant send message. Invalid request");
  }

  const message = await prisma.message.create({
    data: {
      content: "hello hello test from luffy",
      roomId,
      senderId: userId,
    },
  });

  if (!message) {
    throw new ApiError(500, "Cant send message. Server error");
  }

  return message;
}

export async function getMessages(roomId: string) {
  if (!roomId) {
    throw new ApiError(400, "Cant find message. Invalid request");
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

  return messages;
}

export async function getUsers(email: string) {
  if (!email) {
    throw new ApiError(400, "Invalid request");
  }

  return await prisma.user.findMany({
    where: {
      email: email,
    },
    select: { id: true, name: true },
    take: 10,
  });
}
