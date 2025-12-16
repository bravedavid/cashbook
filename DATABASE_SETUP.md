# 数据库设置指南

## 1. 创建 D1 数据库

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 选择 D1
3. 点击 "Create database"
4. 输入数据库名称（例如：`cashbook-db`）
5. 选择区域
6. 点击 "Create"

## 2. 创建数据库表

在 Cloudflare D1 控制台中，执行 `database-schema.sql` 文件中的所有 SQL 语句。

或者使用 Wrangler CLI：

```bash
wrangler d1 execute cashbook-db --file=./database-schema.sql
```

## 3. 配置 Wrangler

在 `wrangler.jsonc` 中更新数据库配置：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "cashbook-db",
    "database_id": "your-database-id-here"  // 从 Cloudflare Dashboard 获取
  }
]
```

## 4. 创建用户

### 方法一：使用脚本（推荐）

1. 运行脚本生成用户 SQL：
```bash
node scripts/create-user.js <username> <password>
```

2. 复制输出的 SQL 语句
3. 在 Cloudflare D1 控制台执行该 SQL

### 方法二：手动创建

1. 使用在线 bcrypt 生成器（如 https://bcrypt-generator.com/）生成密码哈希
2. 在 D1 控制台执行：
```sql
INSERT INTO users (id, username, password_hash) VALUES
('user-001', 'your-username', 'your-bcrypt-hash');
```

### 方法三：使用 Wrangler CLI

```bash
# 首先生成密码哈希（使用 Node.js）
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash));"

# 然后执行插入（替换 YOUR_HASH）
wrangler d1 execute cashbook-db --command "INSERT INTO users (id, username, password_hash) VALUES ('user-001', 'your-username', 'YOUR_HASH');"
```

## 5. 验证设置

登录应用，如果能够成功登录，说明数据库配置正确。

## 注意事项

- 密码使用 bcrypt 加密存储（10 rounds）
- 会话 token 7 天后过期
- 每个用户的数据完全隔离
- 删除用户时会级联删除其所有交易记录和会话

