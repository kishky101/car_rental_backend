import express from "express";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import rateLimit from "express-rate-limit";
// import { createServer } from "http";
// import jwt from "jsonwebtoken";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import uploadRoutes from "./routes/upload.route";
import carRoutes from "./routes/cars.route";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
});

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(compression());
app.use(helmet());
app.use(morgan("dev"));
app.use(limiter);
app.use(cors());

const allowedOrigins = process.env.ALLOWED_HOST
  ? process.env.ALLOWED_HOST?.split(",")
  : [];

// console.log(allowedOrigins);
// app.use(
//   cors({
//     origin: allowedOrigins,
//     methods: "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE",
//     allowedHeaders: "Content-Type,Authorization",
//     credentials: true, // Allows cookies to be sent across domains
//   })
// );

const port = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);
app.use("/api/image", uploadRoutes);
app.use("/api/cars", carRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Working 👌");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
