const express = require('express');
const { Server, Socket } = require('socket.io');
const Room = require("../models/Room");
const Message = require("../models/Message");


/**
 * 
 * @param {express.Application} server 
 */
function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true
        }
    })

    io.on('connection', async (socket) => {
        console.log("client connected");

        // console.log("client connected");
        // socket joins the room named with unique userId

        // when client opens a chat,the 'join-room' event is emitted
        // client joins the room with unique roomId
        // exchanges messages with other client through that ("socket io")room
        // broadcasts notifications to the ALL the users in room including himself

        const userId = socket.handshake.auth.userId;
        socket.join(userId);

        socket.on('join-room', async (roomId) => {
            // console.log('client joined a room');
            socket.join(roomId);
            // console.log(socket.rooms);

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

                const _ = await Message.create({
                    UserId: message.userId,
                    RoomId: message.roomId,
                    content: message.content
                });
                io.to(roomId).emit('message', message);

                roomMembers.forEach(user => {
                    console.log(`sending notification to ${user.id}`);
                    io.to(user.id).emit('notification', message);
                })
            }
            socket.on('message', messageEventHandler);
            
            socket.on('leave-room', (roomId) => {
                // console.log('client left the room');
                socket.leave(roomId);
                socket.removeListener('message', messageEventHandler);
            })
        })

        socket.on('disconnect', () => {
            console.log("client disconnected");
            socket.removeAllListeners();
        })




        // socket.on('online', (data, callback) => {

        //     const ack = io.sockets.adapter.rooms.get(roomId).size > 1;
        //     callback(ack);
        //     // console.log("online");
        //     socket.to(roomId).emit('online', data);

        // });


    })
}




module.exports = initializeSocket;