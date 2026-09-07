import "dotenv/config";
import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import alertRoutes from "./src/routes/alerts.routes.js";
import predictionRoutes from "./src/routes/predictions.routes.js";
import userRoutes from "./src/routes/users.routes.js";
import contactRoutes from "./src/routes/contacts.routes.js";
import locationRoutes from "./src/routes/locations.routes.js";
import sosRoutes from "./src/routes/sos.routes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();
const server = http.createServer(app);
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:5180"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed"));
  },
  credentials: true,
};
const io = new Server(server, { cors: corsOptions });
app.set("io", io);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true }),
  authRoutes,
);
app.use("/api/alerts", alertRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/sos", sosRoutes);
app.get("/", (req, res) =>
  res.json({ status: "ok", service: "bhu-raksha-server", message: "Bhu Raksha API Running" }),
);
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "bhu-raksha-server" }),
);
app.use(errorHandler);
io.on("connection", (socket) =>
  socket.emit("connected", { message: "Bhu Raksha live channel ready" }),
);
const port = Number(process.env.PORT || 5000);
connectDB().catch((error) =>
  console.error(`MongoDB unavailable: ${error.message}`),
);
if (!process.env.VERCEL) {
  server.listen(port, () =>
    console.log(`Bhu Raksha server listening on http://127.0.0.1:${port}`),
  );
}

export default app;

