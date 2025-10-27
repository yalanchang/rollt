import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createConnection } from "mysql2/promise";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/users";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());


app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

export let db: any;

async function initDB() {
  try {
    db = await createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "rollt",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  } catch (error) {
    process.exit(1);
  }
}
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", authMiddleware, userRoutes);


async function startServer() {
  await initDB();

  app.listen(PORT, () => {
    console.log(` 後端服務運行在 http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;