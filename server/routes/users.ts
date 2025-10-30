import express, { Request, Response } from "express";
import { db } from "../index";
import { authMiddleware } from "../middleware/auth";

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

    if ((users as any[]).length === 0) {
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

    const [followStats] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE userId = ?) as postCount,
        (SELECT COUNT(*) FROM follows WHERE followeeId = ?) as followerCount,
        (SELECT COUNT(*) FROM follows WHERE followerId = ?) as followingCount
      `,
      [userId, userId, userId]
    );

    res.json({
      user: (users as any[])[0],
      posts,
      stats: (followStats as any[])[0]
    });
  } catch (error) {
    console.error("獲取用戶錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 更新用戶資料
router.put("/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
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

    res.json((updatedUser as any[])[0]);
  } catch (error) {
    console.error("更新用戶錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 追隨用戶
router.post("/:userId/follow", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    if (userId === followerId?.toString()) {
      return res.status(400).json({ message: "無法追隨自己" });
    }

    // 檢查是否已追隨
    const [existingFollow] = await db.query(
      "SELECT * FROM follows WHERE followeeId = ? AND followerId = ?",
      [userId, followerId]
    );

    if ((existingFollow as any[]).length > 0) {
      return res.status(409).json({ message: "已經追隨此用戶" });
    }

    // 插入追隨關係
    await db.query(
      "INSERT INTO follows (followeeId, followerId) VALUES (?, ?)",
      [userId, followerId]
    );

    res.json({ message: "已追隨" });
  } catch (error) {
    console.error("追隨用戶錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 取消追隨
router.post("/:userId/unfollow", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    await db.query(
      "DELETE FROM follows WHERE followeeId = ? AND followerId = ?",
      [userId, followerId]
    );

    res.json({ message: "已取消追隨" });
  } catch (error) {
    console.error("取消追隨錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

export default router;