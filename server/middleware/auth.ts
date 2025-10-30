import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userAgent?: string;
      ip?: string;
    }
  }
}


export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "缺少認證或格式錯誤的 Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "缺少認證 Token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    req.userId = (decoded as any).userId;
    req.user = decoded;

    next();
  } catch (error) {
    console.error("❌ [MIDDLEWARE] ➤ Token 驗證失敗或錯誤:", error);
    return res.status(403).json({ message: "無效或過期的 Token" });
  }
};

export default authMiddleware;
