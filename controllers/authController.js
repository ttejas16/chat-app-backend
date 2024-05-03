const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Room = require("../models/Room");
const Participant = require("../models/Participant");
const Message = require("../models/Message");

const { uploadImage } = require('../utils/cloudinaryUpload');

function createToken(payload) {
    jwt.decode()
    const token = jwt.sign({ ...payload }, process.env.JWT_SECRET_KEY, { expiresIn: 60 * 60 });
    return token;
}

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
async function getUser(req, res) {
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ success: false, msg: "Unauthorised!", user: {} });
        return;
    }

    const user = await User.findOne({
        where: { id: userId },
        attributes: {
            exclude: ["hash"]
        },
        raw: true
    });

    if (!user) {
        res.status(401).json({ success: false, msg: "Unauthorised!", user: {} });
        return;
    }

    res.status(200).json({ success: true, user: user });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function fetchUserProfile(req, res) {
    const userId = req.user?.profile?.id;

    if (!req.user?.isAuthenticated || !userId) {
        res.json({ success: false, msg: "Unauthorised" });
        return;
    }

    const user = await User.findOne({
        where: {
            id: userId
        },
        attributes: ["id", "userName", "email", "status", "createdAt", "updatedAt"]
    });

    if (!user) {
        res.json({ success: false, msg: "Failed To Fetch Profile Info!" });
        return;
    }

    res.json({ success: true, profile: { ...user.dataValues } });
}

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function updateProfile(req, res) {
    const { avatar, userName, status } = req.body;
    let newAvatarURL = null;

    if (req.file) {
        const result = await uploadImage(req.file);

        if (!result) {
            res.status(400).json({ success: false, msg: "Can't process your request!" });
            return;
        }

        newAvatarURL = result;
    }

    const [updateCount, [updatedUser]] = await User.update({
        avatar: newAvatarURL ? newAvatarURL : avatar,
        userName: userName,
        status: status
    }, {
        where: {
            id: req.user.id
        },
        returning: true,
        raw: true
    });

    if (updateCount == 0) {
        res.json({ success: false, msg: "Cannot Update Profile Try Again Later! " });
        return;
    }

    delete updatedUser.hash;

    res.json({ success: true, msg: "Profile Updated", updatedProfile: updatedUser });
}

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function login(req, res) {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    if (!email || !password) {
        res.status(400).json({ success: false, msg: "Empty credentials are not allowed" });
        return;
    }

    // after validating input credentials
    const user = await User.findOne({
        where: { email: email },
        raw: true
    });

    // check if no such user exists
    if (!user) {
        res.status(400).json({ success: false, msg: "Invalid credentials" });
        return;
    }

    try {
        // compare hash against plain text password
        const validPassword = await bcrypt.compare(password, user.hash);

        if (!validPassword) {
            res.status(400).json({ success: false, msg: "Invalid credentials" });
            return;
        }

        // create new access token 
        //TODO: Making refresh tokens
        const token = createToken({ userName: user.userName, id: user.id });
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(Date.now() + 65 * 60 * 1000)
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: "Internal server error" });
        return;
    }

    delete user.hash;

    res.status(200).json({ success: true, msg: "Login successfull", user: user });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
function logout(req, res) {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });

    res.status(200).json({ success: true, msg: "Logged Out!" });
}


/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
async function signup(req, res) {

    const userName = req.body.userName?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    if (!userName || !email || !password) {
        res.status(400).json({ success: false, msg: "Empty credentials are not allowed" });
        return;
    }

    // after input validation 
    const result = await User.findOne({ where: { email: email } });
    if (result != null) {
        res.status(200).json({ success: false, msg: "The email address is not avaliable" });
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // create a new user
        const _ = await User.create({
            email: email,
            userName: userName,
            hash: hash,
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: "Internal server error" });
        return;
    }

    res.status(200).json({ success: true, msg: "User registered" });
}


module.exports = { login, logout, signup, getUser, fetchUserProfile, updateProfile };