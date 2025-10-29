import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../index";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();


router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    console.log('📝 [REGISTER] 新註冊請求:', { username, email });

    if (!username || !email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://ui-avatars.com/api/?name=${username}&background=random`;

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, defaultAvatar]
    );

    console.log('✅ [REGISTER] 用戶已插入數據庫:', result);

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
        avatar: defaultAvatar
      },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "用戶名或信箱已存在" });
    }
    res.status(500).json({ message: "伺服器錯誤", error: error.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 [LOGIN] 登入請求:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const [users] = await db.query(
      "SELECT id, username, email, password, avatar FROM users WHERE email = ?",
      [email]
    );

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

    res.json({
      message: "登入成功",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      },
    });
  } catch (error: any) {
    console.error("❌ [LOGIN] 登入錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId 不存在" });
    }

    const [users] = await db.query(
      "SELECT id, username, email, avatar, createdAt FROM users WHERE id = ?",
      [userId]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: "用戶不存在" });
    }

    const user = (users as any[])[0];

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    console.error("❌ [ROUTE] /me 錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});


router.put("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { username, email, avatar } = req.body;

    const updates = [];
    const values = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (avatar) {
      updates.push("avatar = ?");
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "沒有要更新的資料" });
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [users] = await db.query(
      "SELECT id, username, email, avatar FROM users WHERE id = ?",
      [userId]
    );

    const updatedUser = (users as any[])[0];

    res.json({
      message: "更新成功",
      user: updatedUser
    });
  } catch (error: any) {
    console.error("❌ [UPDATE] 更新用戶資料錯誤:", error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "用戶名或信箱已存在" });
    }

    res.status(500).json({ message: "伺服器錯誤" });
  }
});

router.get("/verify", authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({
    valid: true,
    userId: req.userId,
    username: (req.user as any)?.username
  });
});

export default router;