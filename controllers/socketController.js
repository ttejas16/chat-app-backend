const express = require('express');
const { Server, Socket } = require('socket.io');
const Room = require("../models/Room");
const Message = require("../models/Message");
const User = require('../models/User');
const { Op } = require('sequelize');


/**
 * 
 * @param {express.Application} server 
 */
function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    })

    io.on('connection', async (socket) => {
        console.log("client connected");

        // socket joins the room named with unique userId

        // when client opens a chat,the 'join-room' event is emitted
        // client joins the room with unique roomId
        // exchanges messages with other client through that ("socket io")room
        // broadcasts notifications to the ALL the users in room including himself

        const userId = socket.handshake.auth.userId;
        socket.join(userId);

        socket.on('join-room', async (roomId) => {

            socket.join(roomId);
            // select all users from the room
            const room = await Room.findOne({
                where: {
                    id: roomId
                }
            })

            let roomMembers = await room.getUsers({
                attributes: ["id", "userName"]
            });

            roomMembers = roomMembers.map((user) => {
                return {
                    id: user.dataValues?.id,
                    userName: user.dataValues?.userName
                }
            })

            async function messageEventHandler(message) {
                // update db
                // send messages to the room members
                // broadcast notifications to the users
                message.roomId = roomId;

                io.to(roomId).emit('message', message);

                roomMembers.forEach(user => {
                    io.to(user.id).emit('notification', message);
                })

                const _ = await Message.create({
                    UserId: message.userId,
                    RoomId: message.roomId,
                    content: message.content
                });
            }
            socket.on('message', messageEventHandler);

            socket.on('leave-room', (roomId) => {
                // console.log('client left the room');
                socket.leave(roomId);
                socket.removeListener('message', messageEventHandler);
            })
        })

        socket.on('online', (roomObjects, callback) => {
            const acknowledgement = {};
            roomObjects.forEach(room => {
                io.to(room.targetUserId).emit('online', room.roomId);

                if (io.sockets.adapter.rooms.has(room.targetUserId)) {
                    acknowledgement[room.roomId] = true;
                }
            });

            callback(acknowledgement);
        })

        socket.on('disconnect', async (params) => {
            // get all rooms of the current user to notify them
            const user = await User.findOne({
                where: {
                    id: socket.handshake.auth.userId
                },
                attributes: ["id"],
            });
            let userRooms = await user.getRooms({
                where: {
                    isGroup: false
                },
                include: [
                    {
                        model: User,
                        where: {
                            id: {
                                [Op.ne]: user.dataValues?.id
                            }
                        },
                        attributes: ["id"],
                    },
                ],
                attributes: ["id"],
            });

            userRooms.forEach(room => {
                io.to(room.dataValues.Users[0].dataValues.id).emit('offline', socket.handshake.auth.userId);
            })

            console.log("client disconnected");
            socket.removeAllListeners();
        })
    })
}




module.exports = initializeSocket;