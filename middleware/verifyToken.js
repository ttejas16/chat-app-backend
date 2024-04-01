const express = require('express');
const jwt = require('jsonwebtoken');

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @returns 
 */
function verifyToken(req, res, next) {
    const token = req.cookies?.accessToken;
    const user = { isAuthenticated: false, profile: {} };

    try {
        if (token && jwt.verify(token, process.env.JWT_SECRET_KEY)) {
            const payload = jwt.decode(token);
            user.profile = {
                ...payload,
            };
            user.isAuthenticated = true;
        }

    } catch (err) {
        console.log("token expired or is invalid");
        console.log(err);
    }

    req.user = user;
    next();
}

module.exports = { verifyToken };