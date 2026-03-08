// controllers/dermatologistController.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import clinicianRoutes from "./routes/clinicianRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dermatologistRoutes from "./routes/dermatologistRoutes.js";
import { setIO } from "./config/socket.js"

dotenv.config();
const app = express();
const PORT = 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

setIO(io); // ADDED — registers io so controllers can call getIO()

// Socket.IO auth using the same JWT
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = payload.user_id;
    next();
  } catch (err) {
    next(new Error("Auth failed"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected, userId:", socket.data.userId);

  socket.on("registerClinician", (clinicianId) => {
    if (!clinicianId) return;
    socket.join(`clinician:${clinicianId}`);
    console.log(
      `Socket userId=${socket.data.userId} joined room clinician:${clinicianId}`
    );
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected, userId:", socket.data.userId);
  });
});

// REMOVED: export { io } — controllers now use getIO() from config/socket.js

// MIDDLEWARE
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("   Query:", req.query);
  console.log(
    "   Headers:",
    req.headers.authorization ? " Token present" : " No token"
  );
  next();
});

// STATIC UPLOADS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.use("/api/auth",          authRoutes);
app.use("/api/cases",         caseRoutes);
app.use("/api/clinicians",    clinicianRoutes);
app.use("/api/patients",      patientRoutes);
app.use("/api/clinician",     appointmentRoutes);
app.use("/api/ai",            aiRoutes);
app.use("/api/dermatologists",dermatologistRoutes);

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server with Socket.IO running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database:", err);
  }
}

startServer();
