import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import clinicianRoutes from "./routes/clinicianRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";


 

dotenv.config();
const app = express();
const PORT = 5001;

// MIDDLEWARE
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

// simple logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ROUTES
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// mount all routers ONCE
app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/clinicians", clinicianRoutes);

//clinician dashboard

app.use("/api/clinicians/patients", patientRoutes);
app.use("/api/clinician", appointmentRoutes);

app.use("/api/clinician", aiRoutes);
 

// START SERVER
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database:", err);
  }
}

startServer();
