import * as dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { json } from "express";
import { app, httpServer } from "./server";


import { verifyToken } from "./middleware/verifyToken";
import authRouter from "./routes/authRouter";
import chatRouter from "./routes/chatRouter";
import initializeSocket from "./controllers/socketController";
import { sequelize } from "./utils/database";
import createAssociations from "./models/Associations";


app.use(morgan("dev"));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT"]
}));

app.use(json());
app.use(cookieParser());
app.use(verifyToken);

app.get("/", (req, res) => {
    res.json('test');
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/chat", chatRouter);

initializeSocket();

app.use((req, res) => {
    res.status(404).json({ success: false, msg: "404 resource not found" });
})

httpServer.listen(process.env.PORT, async () => {
    console.log(`server listening on port ${process.env.PORT}`);

    // creates associations of the database models before creating the tables 
    createAssociations();
    try {
        // creates the tables in the database
        await sequelize.sync();
    } catch (err) {
        console.log(err);
        console.log("table creation failed");
        process.exit(1);
    }
})