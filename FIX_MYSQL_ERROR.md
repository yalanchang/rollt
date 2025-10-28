# 修復 MySQL Packet Too Large 錯誤

## 問題
當您看到 `ER_NET_PACKET_TOO_LARGE` 錯誤時，表示 MySQL 的 `max_allowed_packet` 設置太小，無法處理大的圖片數據。

## 解決方案

### 方法 1：修改 MySQL 配置文件（推薦 - 永久有效）

1. **找到 MySQL 配置文件位置**

   - **macOS** (使用 Homebrew 安裝):
     ```bash
     /opt/homebrew/etc/my.cnf
     # 或
     /usr/local/etc/my.cnf
     ```

   - **Linux**:
     ```bash
     /etc/mysql/my.cnf
     # 或
     /etc/my.cnf
     ```

   - **Windows**:
     ```
     C:\ProgramData\MySQL\MySQL Server X.X\my.ini
     ```

2. **編輯配置文件**

   在 `[mysqld]` 部分添加或修改：

   ```ini
   [mysqld]
   max_allowed_packet=64M
   ```

3. **重啟 MySQL 服務**

   **macOS**:
   ```bash
   brew services restart mysql
   ```

   **Linux**:
   ```bash
   sudo service mysql restart
   # 或
   sudo systemctl restart mysql
   ```

   **Windows**:
   - 打開 "服務" (services.msc)
   - 找到 MySQL 服務
   - 右鍵選擇 "重新啟動"

### 方法 2：臨時修改（重啟後失效）

登入 MySQL 並執行：

```sql
SET GLOBAL max_allowed_packet = 67108864;  -- 64MB
```

然後重啟您的應用服務器。

### 方法 3：在連接字符串中設置

如果您可以修改數據庫連接配置，在連接池選項中添加。

## 驗證設置

登入 MySQL 並檢查：

```sql
SHOW VARIABLES LIKE 'max_allowed_packet';
```

應該顯示：
```
+--------------------+----------+
| Variable_name      | Value    |
+--------------------+----------+
| max_allowed_packet | 67108864 |
+--------------------+----------+
```

## 注意事項

- `max_allowed_packet` 會影響所有數據庫操作，設置太大可能影響性能
- 建議設置為 64MB 對於圖片上傳來說足夠了
- 修改配置後必須重啟 MySQL 服務才能生效

## 如果仍有問題

1. 檢查當前設置：`SHOW VARIABLES LIKE 'max_allowed_packet';`
2. 檢查文件大小：嘗試上傳較小的圖片（< 5MB）
3. 考慮使用雲存儲服務（如 Cloudinary）而不是直接存儲 base64 數據

