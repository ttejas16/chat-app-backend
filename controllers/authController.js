const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require("../models/Room");
const Participant = require("../models/Participant");
const Message = require("../models/Message");

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
    // console.log(req.user);
    res.json({ success: true, user: req.user });
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
    const result = await User.findOne({
        where: { email: email },
        attributes: ["id", "userName", "hash"]
    });

    // check if no such user exists
    if (!result) {
        res.status(400).json({ success: false, msg: "Invalid credentials" });
        return;
    }

    try {
        // compare hash against plain text password
        const hash = result?.dataValues?.hash;
        const validPassword = await bcrypt.compare(password, hash);

        if (!validPassword) {
            res.status(400).json({ success: false, msg: "Invalid credentials" });
            return;
        }

        var userName = result?.dataValues?.userName;
        var id = result?.dataValues?.id;

        // create new access token
        const token = createToken({ userName, id });
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

    const user = {
        isAuthenticated: true,
        profile: { userName, id }
    };

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


module.exports = { login, logout, signup, getUser };