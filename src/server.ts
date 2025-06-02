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
import userRoutes from "./routes/user.route";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
});

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "10kb" }));
app.use(compression());
app.use(helmet());
app.use(morgan("dev"));
app.use(limiter);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // Allows cookies to be sent across domains
    // methods: "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
// app.options("*", cors(), (req, res) => {
//   res.header("Access-Control-Allow-Origin", "http://localhost:5173");
//   res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.sendStatus(200);
// });

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
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Working 👌");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
