import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import HardwareRouter from "./routers/HardwareRouter.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow frontend access
    }
});

// Make io accessible to controllers
app.set('io', io);

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/fintouch_hardware";
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB (Hardware Backend)"))
    .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use("/api", HardwareRouter);

app.get("/", (req, res) => {
    res.send("Hardware Backend is running...");
});

server.listen(PORT, () => {
    console.log(`Hardware Backend listening on port ${PORT}`);
});
