import { io } from "../socket.js";

import {
  clientEvents,
  type MessageEventPayload,
  type OnlineEventAcknowledgement,
  serverEvents,
  type TypingEventPayload,
} from "../types/events.js";
import { prisma } from "../utils/database.js";
import { RoomType } from "../generated/prisma/enums.js";

function initializeSocket() {
  io.on(clientEvents.CONNECTION, (socket) => {
    console.log("client connected");
    socket.onAny((event, ...args) => {
      console.log("Received:", event, args);
    });

    // socket joins the room of unique id(the id of the user itself)

    // when client opens a chat,the 'join-room' event is emitted
    // client joins the room of unique id
    // exchanges messages with other client through that ("socket io")room
    // broadcasts notifications to the ALL the users in room including himself

    const userId = socket.handshake.auth.userId as string;
    socket.join(userId);

    socket.on(clientEvents.JOINROOM, async (roomId) => {
      socket.join(roomId);
      // select all users from the room
      const room = await prisma.room.findUnique({
        where: {
          id: roomId,
        },
        select: {
          members: { select: { user: true } },
        },
      });

      // const users = await room!.getUsers({
      //     attributes: ["id", "userName"],
      //     raw: true
      // });

      const roomMembers = room?.members.map(({ user }) => {
        return {
          id: user.id,
          userName: user.name,
        };
      });

      async function messageEventHandler(message: MessageEventPayload) {
        // update db
        // send messages to the room members
        // broadcast notifications to the users

        io.to(roomId).emit(serverEvents.MESSAGE, message);

        roomMembers?.forEach((user) => {
          io.to(user.id).emit(serverEvents.NOTIFICATION, message);
        });

        const _ = await prisma.message.create({
          data: {
            senderId: message.userId,
            roomId: roomId,
            content: message.content,
          },
        });
      }

      function handleLeaveRoom(roomId: string) {
        // console.log('client left the room');
        socket.leave(roomId);
        socket.removeListener(clientEvents.MESSAGE, messageEventHandler);
        socket.removeListener(clientEvents.TYPING, handleTypingEvents);
        socket.removeListener(clientEvents.LEAVEROOM, handleLeaveRoom);
      }

      function handleTypingEvents(payload: TypingEventPayload) {
        io.to(roomId).except(socket.id).emit(serverEvents.TYPING, payload);
      }

      socket.on(clientEvents.TYPING, handleTypingEvents);
      socket.on(clientEvents.MESSAGE, messageEventHandler);
      socket.on(clientEvents.LEAVEROOM, handleLeaveRoom);
    });

    socket.on(clientEvents.ONLINE, (roomObjects, callback) => {
      const acknowledgement: OnlineEventAcknowledgement = {};

      roomObjects.forEach((room:any) => {
        io.to(room.targetUserId).emit(serverEvents.ONLINE, room.roomId);

        if (io.sockets.adapter.rooms.has(room.targetUserId)) {
          acknowledgement[room.roomId] = true;
        }
      });

      callback(acknowledgement);
    });

    socket.on(clientEvents.DISCONNET, async (params) => {
      // get all rooms of the current user to notify them
      const userRooms = await prisma.roomMember.findMany({
        where: {
          userId: socket.handshake.auth.userId,
          room: { type: RoomType.DM },
        },
        select: { 
            room: {
                select:{
                    id: true,
                    members: {
                        where: {
                            userId: { not: socket.handshake.auth.userId }
                        },
                        select: { userId:true }
                    }
                }
            }
         },
      });
      
      userRooms.forEach(({ room }) => {
        io.to(room.members[0]?.userId || "").emit(
          serverEvents.OFFLINE,
          socket.handshake.auth.userId,
        );
      });

      console.log("client disconnected");
      socket.leave(socket.handshake.auth.userId);
      socket.removeAllListeners();
    });
  });
}

export default initializeSocket;
