import { Op } from "sequelize";
import { io } from "../socket";

import Room from "../models/Room";
import Message from "../models/Message";
import User from "../models/User";

import {
    clientEvents,
    MessageEventPayload,
    OnlineEventAcknowledgement,
    serverEvents,
    TypingEventPayload
} from "../types/events";

function initializeSocket() {

    io.on(clientEvents.CONNECTION, (socket) => {
        console.log("client connected");

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
            const room = await Room.findOne({
                where: {
                    id: roomId
                }
            })

            const users = await room!.getUsers({
                attributes: ["id", "userName"],
                raw: true
            });

            const roomMembers = users.map((user) => {
                return {
                    id: user.id,
                    userName: user.userName
                }
            })

            async function messageEventHandler(message: MessageEventPayload) {
                // update db
                // send messages to the room members
                // broadcast notifications to the users

                io.to(roomId).emit(serverEvents.MESSAGE, message);

                roomMembers.forEach(user => {
                    io.to(user.id).emit(serverEvents.NOTIFICATION, message);
                })

                const _ = await Message.create({
                    userId: message.userId,
                    roomId: message.roomId,
                    content: message.content
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
        })

        socket.on(clientEvents.ONLINE, (roomObjects, callback) => {
            const acknowledgement: OnlineEventAcknowledgement = {};

            roomObjects.forEach((room) => {
                io.to(room.targetUserId).emit(serverEvents.ONLINE, room.roomId);

                if (io.sockets.adapter.rooms.has(room.targetUserId)) {
                    acknowledgement[room.roomId] = true;
                }
            });

            callback(acknowledgement);
        })

        socket.on(clientEvents.DISCONNET, async (params) => {
            // get all rooms of the current user to notify them
            const user = await User.findOne({
                where: {
                    id: socket.handshake.auth.userId
                },
                attributes: ["id"],
            });
            let userRooms = await user!.getRooms({
                where: {
                    isGroup: false
                },
                include: [
                    {
                        model: User,
                        where: {
                            id: {
                                [Op.ne]: user!.dataValues?.id
                            }
                        },
                        attributes: ["id"],
                    },
                ],
                attributes: ["id"],
            });
            userRooms.forEach(room => {
                io.to(room.dataValues.Users![0].dataValues.id)
                    .emit(serverEvents.OFFLINE, socket.handshake.auth.userId);
            })

            console.log("client disconnected");
            socket.leave(socket.handshake.auth.userId);
            socket.removeAllListeners();
        })
    })
}

export default initializeSocket;