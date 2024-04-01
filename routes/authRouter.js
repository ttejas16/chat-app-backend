const express = require('express');
const authRouter = express.Router();

const { login, signup, getUser, logout } = require('../controllers/authController');

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/signup', signup);
authRouter.post('/getUser', getUser);

module.exports = authRouter;