import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";  
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/users";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

export let db: any;

async function initDB() {
  try {
    db = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "rollt",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // 設置 MySQL max_allowed_packet 以支持大文件上傳
    await db.query("SET GLOBAL max_allowed_packet = 67108864"); // 64MB
    console.log('✅ MySQL max_allowed_packet 已設置為 64MB');
  } catch (error: any) {
    // 如果設置 GLOBAL 失敗（可能是權限問題），嘗試 SESSION
    if (error.code === 'ER_SPECIFIC_ACCESS_DENIED_ERROR') {
      try {
        await db.query("SET SESSION max_allowed_packet = 67108864");
        console.log('✅ MySQL SESSION max_allowed_packet 已設置為 64MB');
      } catch (sessionError) {
        console.log('⚠️ 無法設置 max_allowed_packet，請手動在 MySQL 配置中設置');
      }
    } else {
      console.error('初始化數據庫錯誤:', error);
      process.exit(1);
    }
  }
}
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);


async function startServer() {
  await initDB();

  app.listen(PORT, () => {
    console.log(` 後端服務運行在 http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;