const { upload } = require('../middleware/multer');
const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/authController');

authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/signup', authController.signup);

authRouter.get('/getUser', authController.getUser);
authRouter.post('/profile', authController.fetchUserProfile);

authRouter.put('/updateProfile', upload.single("avatar"), authController.updateProfile);

module.exports = authRouter;