-- 創建數據庫
CREATE DATABASE IF NOT EXISTS rollt;
USE rollt;

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- 貼文表
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  caption TEXT,
  imageUrl TEXT NOT NULL,
  mediaType VARCHAR(10) DEFAULT 'image' COMMENT 'image or video',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
);

-- 喜歡表
CREATE TABLE IF NOT EXISTS likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  postId INT NOT NULL,
  userId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (postId, userId),
  INDEX idx_postId (postId),
  INDEX idx_userId (userId)
);

-- 評論表
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  postId INT NOT NULL,
  userId INT NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_postId (postId),
  INDEX idx_userId (userId)
);

-- 追隨表
CREATE TABLE IF NOT EXISTS follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL COMMENT '被追隨的用戶',
  followerId INT NOT NULL COMMENT '追隨者',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (userId, followerId),
  INDEX idx_userId (userId),
  INDEX idx_followerId (followerId)
);

-- 示例數據
INSERT INTO users (username, email, password, bio) VALUES
('demouser', 'demo@rollt.com', '$2a$10$YIjlrJxnM6YvY5YvY5YvY', 'Hello, I am a demo user'),
('johndoe', 'john@example.com', '$2a$10$YIjlrJxnM6YvY5YvY5YvY', 'Photography lover');

INSERT INTO posts (userId, caption, imageUrl) VALUES
(1, '美好的一天從分享開始 ✨', 'https://picsum.photos/500/500?random=1'),
(1, '享受生活中的每一刻 🎉', 'https://picsum.photos/500/500?random=2'),
(2, '旅遊照片分享 📸', 'https://picsum.photos/500/500?random=3');


INSERT INTO comments (postId, userId, content, createdAt, updatedAt) VALUES

(4, 3, '謝謝你的建議，對我很有啟發。', '2025-10-30 11:15:35', '2025-10-30 11:15:35');

-- ========== 會話表 ==========
CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  device_name VARCHAR(100),
  browser_info VARCHAR(255),
  ip_address VARCHAR(50),
  location VARCHAR(100),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_id (user_id),
  KEY idx_is_active (is_active),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 密碼變更日誌表 ==========
CREATE TABLE IF NOT EXISTS password_change_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  browser_info VARCHAR(255),
  change_reason ENUM('USER_REQUEST', 'FORCE_RESET', 'SECURITY_BREACH') DEFAULT 'USER_REQUEST',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_id (user_id),
  KEY idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 安全稽核日誌表 ==========
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  browser_info VARCHAR(255),
  location VARCHAR(100),
  status ENUM('SUCCESS', 'FAILED', 'SUSPICIOUS') DEFAULT 'SUCCESS',
  details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_id (user_id),
  KEY idx_action (action),
  KEY idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 兩因子認證備份碼表 ==========
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  code VARCHAR(255) UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_id (user_id),
  KEY idx_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 登入嘗試表 (防暴力破解) ==========
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  is_success BOOLEAN DEFAULT FALSE,
  reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_email (email),
  KEY idx_ip_address (ip_address),
  KEY idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 修改現有 users 表 (只添加安全相關欄位) ==========
-- 執行以下查詢來添加缺少的安全欄位（如果還沒有的話）

-- 檢查並添加 two_factor_enabled 欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- 檢查並添加 two_factor_secret 欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- 檢查並添加 two_factor_enabled_at 欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMP NULL;

-- 檢查並添加 password_updated_at 欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 檢查並添加 last_password_reset_at 欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_reset_at TIMESTAMP NULL;

-- 添加索引以提高性能
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_two_factor_enabled (two_factor_enabled);

-- ========== 自動刪除過期數據的事件 ==========

-- 刪除 90 天前的密碼變更日誌
CREATE EVENT IF NOT EXISTS delete_old_password_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM password_change_logs
  WHERE changed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 刪除 180 天前的稽核日誌
CREATE EVENT IF NOT EXISTS delete_old_audit_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM security_audit_logs
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL 180 DAY);

-- 刪除 30 天前的登入嘗試
CREATE EVENT IF NOT EXISTS delete_old_login_attempts
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM login_attempts
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 刪除已過期的會話
CREATE EVENT IF NOT EXISTS delete_expired_sessions
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM sessions
  WHERE expires_at < NOW();