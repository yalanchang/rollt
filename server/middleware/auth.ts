import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("🧩 [MIDDLEWARE] ➤ 進入 authMiddleware:", req.method, req.path);
  const authHeader = req.headers.authorization;
  console.log("🧩 [MIDDLEWARE] ➤ Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("🧩 [MIDDLEWARE] ➤ 缺少或格式錯誤的 Authorization header");
    return res.status(401).json({ message: "缺少認證或格式錯誤的 Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("🧩 [MIDDLEWARE] ➤ 切割後 token 為空");
    return res.status(401).json({ message: "缺少認證 Token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    console.log("🧩 [MIDDLEWARE] ➤ Token 驗證成功，decoded:", decoded);

    req.userId = (decoded as any).userId;
    req.user = decoded;

    console.log("🧩 [MIDDLEWARE] ➤ 設定 req.userId:", req.userId);
    next();
  } catch (error) {
    console.error("❌ [MIDDLEWARE] ➤ Token 驗證失敗或錯誤:", error);
    return res.status(403).json({ message: "無效或過期的 Token" });
  }
};

export default authMiddleware;
