import express, { Request, Response } from "express";
import { db } from "../index";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// 獲取動態牆
router.get("/feed", async (req: AuthRequest, res: Response) => {
  try {
    const [posts] = await db.query(`
      SELECT 
        p.id,
        p.userId,
        p.imageUrl,
        p.caption,
        p.createdAt,
        u.username,
        u.avatar as userAvatar,
        (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) as comments
      FROM posts p
      JOIN users u ON p.userId = u.id
      ORDER BY p.createdAt DESC
      LIMIT 50
    `);

    res.json(posts);
  } catch (error) {
    console.error("獲取動態牆錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 創建貼文
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { caption, imageUrl } = req.body;
    const userId = req.userId;

    if (!imageUrl) {
      return res.status(400).json({ message: "缺少圖片" });
    }

    await db.query(
      "INSERT INTO posts (userId, caption, imageUrl) VALUES (?, ?, ?)",
      [userId, caption || "", imageUrl]
    );

    const [newPost] = await db.query(
      `SELECT 
        p.id,
        p.userId,
        p.imageUrl,
        p.caption,
        p.createdAt,
        u.username,
        u.avatar as userAvatar
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.userId = ?
      ORDER BY p.createdAt DESC
      LIMIT 1`,
      [userId]
    );

    res.status(201).json(newPost[0]);
  } catch (error) {
    console.error("創建貼文錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 喜歡貼文
router.post(
  "/:postId/like",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { postId } = req.params;
      const userId = req.userId;

      // 檢查是否已經喜歡
      const [existingLike] = await db.query(
        "SELECT * FROM likes WHERE postId = ? AND userId = ?",
        [postId, userId]
      );

      if (existingLike.length > 0) {
        return res.status(409).json({ message: "已經喜歡過此貼文" });
      }

      await db.query(
        "INSERT INTO likes (postId, userId) VALUES (?, ?)",
        [postId, userId]
      );

      res.json({ message: "已喜歡" });
    } catch (error) {
      console.error("喜歡貼文錯誤:", error);
      res.status(500).json({ message: "伺服器錯誤" });
    }
  }
);

// 取消喜歡
router.post(
  "/:postId/unlike",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { postId } = req.params;
      const userId = req.userId;

      await db.query(
        "DELETE FROM likes WHERE postId = ? AND userId = ?",
        [postId, userId]
      );

      res.json({ message: "已取消喜歡" });
    } catch (error) {
      console.error("取消喜歡錯誤:", error);
      res.status(500).json({ message: "伺服器錯誤" });
    }
  }
);

// 刪除貼文
router.delete(
  "/:postId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { postId } = req.params;
      const userId = req.userId;

      const [post] = await db.query("SELECT * FROM posts WHERE id = ?", [
        postId,
      ]);

      if (post.length === 0) {
        return res.status(404).json({ message: "貼文不存在" });
      }

      if (post[0].userId !== userId) {
        return res.status(403).json({ message: "沒有權限刪除" });
      }

      await db.query("DELETE FROM posts WHERE id = ?", [postId]);

      res.json({ message: "貼文已刪除" });
    } catch (error) {
      console.error("刪除貼文錯誤:", error);
      res.status(500).json({ message: "伺服器錯誤" });
    }
  }
);

export default router;