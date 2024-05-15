const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Participant = require('../models/Participant');
const { sequelize } = require('../utils/database');
const { Op } = require('sequelize');


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function addRoom(req, res) {
    const userId = req.body.userId; // id of user who creates a room/chat/group
    const participantIds = req.body.participants; // array of id(user)
    const isGroup = req.body.isGroup;
    const roomName = req.body.roomName || "";

    if (!userId || !participantIds || participantIds.length == 0) {
        res.status(400).json({ success: false, msg: "Can Not Add Rooms!" });
        return;
    }

    const owner = await User.findOne({
        where: {
            id: userId
        },
        attributes: ["id"]
    })

    if (!owner) {
        res.status(401).json({ success: false, msg: "Unauthorised" });
        return;
    }

    let privateRoomName = "";

    if (!isGroup) {
        const user = await User.findOne({
            where: {
                id: participantIds[0]
            },
            attributes: ["id", "userName"]
        });

        // to check if chat/user (as this is not a group) already exists
        const previousRooms = await owner.getRooms({
            include: [
                {
                    model: User,
                    attributes: ["id"],
                    on: {
                        id: sequelize.col('User.id')
                    },
                    where: {
                        id: participantIds[0]
                    }
                }
            ]
        });

        if (previousRooms.length > 0) {
            res.status(400).json({
                success: false,
                msg: `You Already Have A Chat With ${user.dataValues?.userName}`
            });
            return;
        }

        // set opposite user's name
        privateRoomName = user.dataValues?.userName;
    }

    let room = await Room.create({
        roomName: isGroup ? roomName : "",
        isGroup: isGroup
    });

    if (!room) {
        res.status(400).json({ success: false, msg: "Failed To Create Chat" });
        return;
    }

    const _ = await room.addUsers([userId, ...participantIds]);

    room = {
        id: room.dataValues?.id,
        isGroup: room.dataValues?.isGroup,
        roomName: room.dataValues?.isGroup ? room.dataValues?.roomName : privateRoomName,
        lastMessage: null
    }
    res.status(200).json({ success: true, msg: "Created A Room", room: room });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function searchUsers(req, res) {
    const email = req.body.email;

    if (!email) {
        res.status(400).json({ success: false, msg: "Please Provide Details" });
        return;
    }

    const result = await User.findAll({
        where: {
            email: email
        },
        attributes: ["id", "userName"],
        limit: 10
    });

    if (result.length == 0) {
        res.status(200).json({ success: true, msg: "No Users Found!", users: [] })
        return;
    }

    const users = result.map((v) => {
        return v.dataValues;
    })

    res.json({ success: true, msg: "Users Found", users: users });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function getRoomList(req, res) {
    const userId = req.body.userId;

    //check if refrence id is provided or not
    if (!userId) {
        res.status(400).json({ success: false, msg: "Chats Not Found!" });
        return;
    }

    const user = await User.findOne({
        where: {
            id: userId,
        }
    })

    // check if such user exists
    if (!user) {
        res.status(401).json({ success: false, msg: "Unauthorised" });
        return;
    }

    let userRooms = await user.getRooms({
        include: [
            {
                model: User,
                attributes: ["id", "userName", "avatar"]
            },
            {
                model: Message,
                attributes: ["content", "UserId"],
                include: {
                    model: User,
                    attributes: ["userName"]
                },
                order: [
                    ["createdAt", "DESC"]
                ],
                limit: 1
            }
        ],
        attributes: ["id", "isGroup", "roomName"]
    });


    let rooms = userRooms.map((room) => {
        let roomName = room.dataValues?.roomName;
        let targetUserId = null;
        let avatar = null;
        let lastMessage = room.dataValues?.Messages.map((msg) => {
            let user = msg.dataValues?.User;

            return {
                content: msg.dataValues?.content,
                user: {
                    id: msg.dataValues?.UserId,
                    userName: user.dataValues?.userName,
                }
            };
        });

        if (!room.dataValues?.isGroup) {
            room.dataValues?.Users?.forEach(u => {

                if (u.id !== user.id) {
                    roomName = u.dataValues?.userName;
                    avatar = u.dataValues?.avatar
                    targetUserId = u.dataValues?.id;
                }
            });
        }

        return {
            id: room.dataValues?.id,
            isGroup: room.dataValues?.isGroup,
            roomName: roomName,
            targetUserId: targetUserId,
            avatar: avatar,
            lastMessage: lastMessage.length != 0 ? lastMessage[0] : null
        };
    });

    res.status(200).json({ success: true, msg: "Found Rooms", rooms: rooms });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function addMessage(req, res) {
    const userId = req.body.userId;
    const roomId = req.body.roomId;

    if (!roomId || !userId) {
        res.status(400).json({ success: false, msg: "Can Not Add Message" });
        return;
    }

    try {
        const _ = await Message.create({
            content: "hello hello test from luffy",
            UserId: userId,
            RoomId: roomId
        });

    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, msg: "Something Went Wrong!" });
        return;
    }

    res.status(200).json({ success: true, msg: "Message Sent" });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function getMessages(req, res) {
    const roomId = req.body.roomId;

    //check if room refrence id is provided or not
    if (!roomId) {
        res.status(400).json({ success: false, msg: "Chats Not Found!" });
        return;
    }

    const result = await Message.findAll({
        where: {
            RoomId: roomId
        },
        include: {
            model: User,
            attributes: ["userName"]
        },
        attributes: ["UserId", "RoomId", "content"],
        order: [
            ["createdAt", "DESC"]
        ],
        limit: 20
    })

    if (!result.length) {
        res.status(200).json({ success: true, msg: "No Messages For Specified Room", messages: [] });
        return;
    }

    let messages = result.map((msg, index) => {
        return {
            content: msg.dataValues?.content,
            userId: msg.dataValues?.UserId,
            roomId: msg.dataValues?.RoomId,
            userName: msg.dataValues?.User?.userName
        }
    })
    messages = messages.reverse()

    res.status(200).json({ success: true, msg: "Found Messages", messages: messages });
}

module.exports = { addRoom, getRoomList, addMessage, getMessages, searchUsers };