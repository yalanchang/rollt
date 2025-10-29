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
    const [columns] = await db.query(
      "SHOW COLUMNS FROM posts LIKE 'mediaType'"
    );

    const hasMediaType = ((columns as any[]).length > 0);
    const mediaTypeField = hasMediaType ? 'p.mediaType,' : '';

    const [posts] = await db.query(`
      SELECT 
        p.id,
        p.userId,
        p.imageUrl,
        ${mediaTypeField}
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

    const formattedPosts = (posts as any[]).map(post => ({
      ...post,
      mediaType: post.mediaType || 'image'
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("獲取動態牆錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});
// 獲取自己貼文
router.get("/my-posts", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const [columns] = await db.query(
      "SHOW COLUMNS FROM posts LIKE 'mediaType'"
    );
    const hasMediaType = ((columns as any[]).length > 0);
    const mediaTypeField = hasMediaType ? 'p.mediaType,' : '';

    const [posts] = await db.query(`
      SELECT 
        p.id,
        p.userId,
        p.imageUrl,
        ${mediaTypeField}
        p.caption,
        p.createdAt,
        u.username,
        u.avatar as userAvatar,
        (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) as comments
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.userId = ?
      ORDER BY p.createdAt DESC
    `, [userId]);

    const formattedPosts = (posts as any[]).map(post => ({
      ...post,
      mediaType: post.mediaType || 'image'
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("獲取自己的貼文錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});


router.get("/:postId", async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const [posts] = await db.query(`
      SELECT 
        p.id,
        p.userId,
        p.imageUrl,
        p.caption,
        p.createdAt,
        u.username,
        (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) as comments
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `, [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ message: "貼文不存在" });
    }

    res.json(posts[0]);
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
});
// 創建貼文
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { caption, imageUrl, mediaType } = req.body;
    const userId = req.userId;

    console.log('📝 收到創建貼文請求:', { userId, hasCaption: !!caption, hasImageUrl: !!imageUrl, mediaType });

    if (!imageUrl) {
      return res.status(400).json({ message: "缺少媒體文件" });
    }

    // 設置當前連接的 max_allowed_packet 以支持大文件
    try {
      await db.query("SET SESSION max_allowed_packet = 67108864");
    } catch (setError) {
      console.log('⚠️ 無法設置 max_allowed_packet');
    }

    // 檢查 mediaType 字段是否存在
    let hasMediaType = false;
    try {
      const [columns] = await db.query(
        "SHOW COLUMNS FROM posts LIKE 'mediaType'"
      );
      hasMediaType = (columns as any[]).length > 0;
    } catch (checkError) {
    }

    // 插入數據
    if (hasMediaType) {
      await db.query(
        "INSERT INTO posts (userId, caption, imageUrl, mediaType) VALUES (?, ?, ?, ?)",
        [userId, caption || "", imageUrl, mediaType || 'image']
      );
    } else {
      // 如果字段不存在，使用舊格式（兼容舊數據庫）
      console.log('✅ 使用舊格式插入（不包含 mediaType）');
      await db.query(
        "INSERT INTO posts (userId, caption, imageUrl) VALUES (?, ?, ?)",
        [userId, caption || "", imageUrl]
      );
    }

    const selectFields = hasMediaType
      ? 'p.id, p.userId, p.imageUrl, p.mediaType, p.caption, p.createdAt, u.username, u.avatar as userAvatar'
      : 'p.id, p.userId, p.imageUrl, p.caption, p.createdAt, u.username, u.avatar as userAvatar';

    console.log('🔍 查詢字段:', selectFields);

    const [newPost] = await db.query(
      `SELECT ${selectFields}
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.userId = ?
      ORDER BY p.createdAt DESC
      LIMIT 1`,
      [userId]
    );

    // 確保返回的數據有 mediaType
    if (!hasMediaType && newPost && (newPost as any[]).length > 0) {
      (newPost as any[])[0].mediaType = 'image'; // 默認為圖片
    }

    console.log('✅ 貼文創建成功');

    res.status(201).json(newPost[0]);
  } catch (error: any) {
    console.error("創建貼文錯誤:", error);
    console.error("詳細錯誤:", error.message);
    console.error("錯誤代碼:", error.code);

    // 提供更友好的錯誤信息
    let errorMessage = "伺服器錯誤";
    if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = "圖片數據太大，請壓縮圖片或使用較小的文件";
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      message: errorMessage,
      error: error.message
    });
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