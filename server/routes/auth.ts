import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../index";
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { authMiddleware, AuthRequest } from "../middleware/auth";

declare global {
  namespace Express {
    interface Request {
      userAgent?: string;
      ip?: string;
    }
  }
}

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


    const token = jwt.sign(
      { userId: (result as any).insertId, username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );


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


    if (!email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const [users] = await db.query(
      "SELECT id, username, email, password, avatar FROM users WHERE email = ?",
      [email]
    );

    if ((users as any[]).length === 0) {
      return res.status(401).json({ message: "信箱或密碼錯誤" });
    }

    const user = (users as any[])[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "信箱或密碼錯誤" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    try {
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ip = req.socket.remoteAddress || req.ip || 'unknown';
      function parseUserAgent(userAgent: string) {
        if (userAgent.includes('Chrome')) {
          return 'Chrome';
        } else if (userAgent.includes('Firefox')) {
          return 'Firefox';
        } else if (userAgent.includes('Safari')) {
          return 'Safari';
        } else if (userAgent.includes('Edge')) {
          return 'Edge';
        }
        return '未知瀏覽器';
      }
      const deviceBrowser = parseUserAgent(userAgent);

      await db.query(
        `INSERT INTO sessions ( user_id, token, device_name, browser_info, ip_address, is_active, expires_at, last_activity_at)
         VALUES ( ?, ?, ?, ?, ?, TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
        [user.id, token,'Browser', deviceBrowser, ip]
      );

    } catch (sessionErr) {
      console.warn(' [LOGIN] 會話記錄失敗:', sessionErr);
    }

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

// ========== 密碼管理 ==========

router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.socket.remoteAddress || req.ip || 'unknown';
    const { currentPassword, newPassword } = req.body;

    // 驗證輸入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '缺少必要信息' });
    }

    // 密碼強度檢查
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(newPassword)) {
      return res.status(400).json({
        message: '密碼必須至少 8 個字符，包含大小寫字母、數字和特殊符號'
      });
    }

    const [users] = await db.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    ) as any;

    if (users.length === 0) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    const user = users[0];

    // 驗證當前密碼
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '當前密碼不正確' });
    }

    // 檢查新密碼是否與舊密碼相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: '新密碼不能與舊密碼相同' });
    }

    // 加密新密碼
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ 更新密碼
    await db.query(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    // ✅ 記錄日誌（可選，失敗不影響主流程）
    try {
      await db.query(
        'INSERT INTO password_change_logs (user_id, ip_address, browser_info, change_reason) VALUES (?, ?, ?, ?)',
        [userId, ip, userAgent, 'USER_REQUEST']
      );
    } catch (logError) {
      console.warn('記錄密碼變更日誌失敗:', logError);
    }

    try {
      await db.query(
        'INSERT INTO security_audit_logs (user_id, action, ip_address, browser_info, status) VALUES (?, ?, ?, ?, ?)',
        [userId, 'PASSWORD_CHANGED', ip, userAgent, 'SUCCESS']
      );
    } catch (logError) {
      console.warn('記錄安全事件失敗:', logError);
    }

    res.json({
      success: true,
      message: '密碼已成功更改'
    });
  } catch (error) {
    console.error('更改密碼出錯:', error);
    res.status(500).json({ message: '伺服器錯誤', error: (error as any).message });
  }
});


router.post('/2fa/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const [users] = await db.query(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    ) as any;

    if (users.length === 0) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    const user = users[0];

    const secret = speakeasy.generateSecret({
      name: `你的應用 (${user.email})`,
      length: 32
    });

    console.log('🔐 OTP Auth URL:', secret.otpauth_url);

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    await db.query(
      'UPDATE users SET two_factor_secret = ? WHERE id = ?',
      [secret.base32, userId]
    );

    res.json({
      qrCode,
      secret: secret.base32,
      message: '請使用認證應用掃描 QR Code'
    });
  } catch (error) {
    console.error('生成 2FA 出錯:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

/**
 * 驗證 2FA 代碼
 * POST /api/auth/2fa/verify
 */
router.post('/2fa/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { code } = req.body;
    const ip = req.socket.remoteAddress || req.ip || 'unknown';

    if (!code) {
      return res.status(400).json({ message: '缺少驗證碼' });
    }

    const [users] = await db.query(
      'SELECT two_factor_secret FROM users WHERE id = ?',
      [userId]
    ) as any;

    if (users.length === 0 || !users[0].two_factor_secret) {
      return res.status(400).json({ message: '2FA 未設置' });
    }

    // 驗證代碼
    const isValid = speakeasy.totp.verify({
      secret: users[0].two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) {
      // 記錄失敗的驗證嘗試
      try {
        await db.query(
          'INSERT INTO security_audit_logs (user_id, action, ip_address, status) VALUES (?, ?, ?, ?)',
          [userId, '2FA_VERIFICATION_FAILED', ip, 'FAILED']
        );
      } catch (err) {
        console.warn('記錄失敗日誌失敗:', err);
      }

      return res.status(401).json({ message: '驗證碼不正確' });
    }

    await db.query(
      'UPDATE users SET two_factor_enabled = TRUE, two_factor_enabled_at = NOW() WHERE id = ?',
      [userId]
    );

    // 記錄日誌
    try {
      await db.query(
        'INSERT INTO security_audit_logs (user_id, action, ip_address, status) VALUES (?, ?, ?, ?)',
        [userId, '2FA_ENABLED', ip, 'SUCCESS']
      );
    } catch (err) {
      console.warn('記錄啟用日誌失敗:', err);
    }

    // 生成備份碼
    const backupCodes = [];
    try {
      for (let i = 0; i < 10; i++) {
        const backupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        backupCodes.push(backupCode);
        
        const hashedCode = await bcrypt.hash(backupCode, 10);
        await db.query(
          'INSERT INTO two_factor_backup_codes (user_id, code) VALUES (?, ?)',
          [userId, hashedCode]
        );
      }
    } catch (err) {
      console.warn('生成備份碼失敗:', err);
    }

    res.json({
      success: true,
      message: '雙因子認證已啟用',
      backupCodes
    });
  } catch (error) {
    console.error('驗證 2FA 出錯:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


router.post('/2fa/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const ip = req.socket.remoteAddress || req.ip || 'unknown';
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: '請輸入密碼以禁用 2FA' });
    }

    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    ) as any;

    if (users.length === 0) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '密碼不正確' });
    }

    await db.query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = ?',
      [userId]
    );

    // 刪除備份碼
    try {
      await db.query(
        'DELETE FROM two_factor_backup_codes WHERE user_id = ?',
        [userId]
      );
    } catch (err) {
      console.warn('刪除備份碼失敗:', err);
    }

    // 記錄日誌
    try {
      await db.query(
        'INSERT INTO security_audit_logs (user_id, action, ip_address, status) VALUES (?, ?, ?, ?)',
        [userId, '2FA_DISABLED', ip, 'SUCCESS']
      );
    } catch (err) {
      console.warn('記錄禁用日誌失敗:', err);
    }

    res.json({
      success: true,
      message: '雙因子認證已禁用'
    });
  } catch (error) {
    console.error('禁用 2FA 出錯:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ========== 會話管理 API ==========

router.get('/security-info', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const [users] = await db.query(
      'SELECT two_factor_enabled FROM users WHERE id = ?',
      [userId]
    ) as any;

    if (users.length === 0) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 查詢活躍會話
    let sessions = [];
    try {
      const [sessionResults] = await db.query(
        `SELECT id, device_name, browser_info, location, last_activity_at
         FROM sessions
         WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
         ORDER BY last_activity_at DESC`,
        [userId]
      ) as any;

      sessions = sessionResults.map((session: any) => ({
        id: session.id,
        deviceName: session.device_name,
        browser: session.browser_info,
        location: session.location || '未知',
        lastActive: session.last_activity_at
      }));
    } catch (err) {
      console.warn('查詢會話失敗:', err);
    }

    res.json({
      twoFactorEnabled: users[0].two_factor_enabled,
      sessions
    });
  } catch (error) {
    console.error('獲取安全信息出錯:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


router.post('/logout-session/:sessionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    // 驗證會話所有權
    const [sessions] = await db.query(
      'SELECT id FROM sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    ) as any;

    if (sessions.length === 0) {
      return res.status(404).json({ message: '會話不存在' });
    }

    // 禁用會話
    await db.query(
      'UPDATE sessions SET is_active = FALSE, deactivated_at = NOW() WHERE id = ?',
      [sessionId]
    );

    res.json({
      success: true,
      message: '已登出該設備'
    });
  } catch (error) {
    console.error('登出會話出錯:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

/**
 * 登出所有設備
 * POST /api/auth/logout-all-devices
 */
router.post('/logout-all-devices', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentSessionId = (req as any).sessionId;
    const ip = req.socket.remoteAddress || req.ip || 'unknown';

    await db.query(
      'UPDATE sessions SET is_active = FALSE, deactivated_at = NOW() WHERE user_id = ? AND id != ? AND is_active = TRUE',
      [userId, currentSessionId]
    );

    // 記錄日誌
    try {
      await db.query(
        'INSERT INTO security_audit_logs (user_id, action, ip_address, status) VALUES (?, ?, ?, ?)',
        [userId, 'LOGOUT_ALL_DEVICES', ip, 'SUCCESS']
      );
    } catch (err) {
      console.warn('記錄登出所有設備日誌失敗:', err);
    }

    res.json({
      success: true,
      message: '已登出所有其他設備'
    });
  } catch (error) {
    console.error('登出所有設備出錯:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

export default router;