-- 数据库迁移脚本：添加备注字段
-- 如果 transactions 表已经存在，执行此脚本来添加 note 字段
-- 在 Cloudflare D1 控制台执行此 SQL 语句

-- 添加 note 字段（如果不存在）
-- SQLite 不支持直接检查列是否存在，所以使用 ALTER TABLE ADD COLUMN IF NOT EXISTS
-- 但 SQLite 也不支持 IF NOT EXISTS，所以如果字段已存在会报错，可以忽略

ALTER TABLE transactions ADD COLUMN note TEXT;

