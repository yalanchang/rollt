import express, { Request, Response } from "express";
import { db } from "../index";

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// 取得用戶資料
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [users] = await db.query(
      "SELECT id, username, email, bio, avatar FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "用戶不存在" });
    }

    const [posts] = await db.query(
      `SELECT 
        p.id,
        p.userId,
        p.imageUrl,
        p.caption,
        p.createdAt,
        (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) as comments
      FROM posts p
      WHERE p.userId = ?
      ORDER BY p.createdAt DESC`,
      [userId]
    );

    res.json({
      user: users[0],
      posts,
    });
  } catch (error) {
    console.error("獲取用戶錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 更新用戶資料
router.put("/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, bio, avatar } = req.body;

    if (userId !== req.userId?.toString()) {
      return res.status(403).json({ message: "沒有權限修改" });
    }

    await db.query(
      "UPDATE users SET username = ?, bio = ?, avatar = ? WHERE id = ?",
      [username, bio, avatar, userId]
    );

    const [updatedUser] = await db.query(
      "SELECT id, username, email, bio, avatar FROM users WHERE id = ?",
      [userId]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    console.error("更新用戶錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 追隨用戶
router.post("/:userId/follow", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    if (userId === followerId?.toString()) {
      return res.status(400).json({ message: "無法追隨自己" });
    }

    const [existingFollow] = await db.query(
      "SELECT * FROM follows WHERE userId = ? AND followerId = ?",
      [userId, followerId]
    );

    if (existingFollow.length > 0) {
      return res.status(409).json({ message: "已經追隨此用戶" });
    }

    await db.query(
      "INSERT INTO follows (userId, followerId) VALUES (?, ?)",
      [userId, followerId]
    );

    res.json({ message: "已追隨" });
  } catch (error) {
    console.error("追隨用戶錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 取消追隨
router.post("/:userId/unfollow", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    await db.query(
      "DELETE FROM follows WHERE userId = ? AND followerId = ?",
      [userId, followerId]
    );

    res.json({ message: "已取消追隨" });
  } catch (error) {
    console.error("取消追隨錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

export default router;