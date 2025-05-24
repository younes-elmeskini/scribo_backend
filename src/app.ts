import express from "express";
import cookieParser from "cookie-parser";

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
  })
);

app.disable("x-powered-by");

app.use(helmet());
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use(limiter);
// Routes
import authRoutes from "./modules/client/routes/auth.route";
// import adminRoutes from "./modules/admin/routes/auth.route";
// import publicRoutes from "./modules/public/routes/form.route";

app.use("/client/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/public", publicRoutes);


export default app;
