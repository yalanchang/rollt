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
  imageUrl VARCHAR(255) NOT NULL,
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

