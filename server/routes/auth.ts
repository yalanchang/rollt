import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../index";

const router = express.Router();

// 註冊
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    console.log('📝 [REGISTER] 新註冊請求:', { username, email });

    // 驗證
    if (!username || !email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入數據庫
    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    console.log('✅ [REGISTER] 用戶已插入數據庫:', result);

    // 生成 token
    const token = jwt.sign(
      { userId: (result as any).insertId, username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log('🎫 [REGISTER] Token 已生成');

    res.status(201).json({
      message: "註冊成功",
      token,
      user: {
        id: (result as any).insertId,
        username,
        email,
      },
    });
  } catch (error: any) {
    
    // 處理重複的用戶名或信箱
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "用戶名或信箱已存在" });
    }

    res.status(500).json({ message: "伺服器錯誤", error: error.message });
  }
});

// 登入
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 [LOGIN] 登入請求:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if ((users as any[]).length === 0) {
      console.log('❌ [LOGIN] 用戶不存在:', email);
      return res.status(401).json({ message: "信箱或密碼錯誤" });
    }

    const user = (users as any[])[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ [LOGIN] 密碼錯誤');
      return res.status(401).json({ message: "信箱或密碼錯誤" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log('✅ [LOGIN] 登入成功:', user.username);

    res.json({
      message: "登入成功",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    console.error("❌ [LOGIN] 登入錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

export default router;