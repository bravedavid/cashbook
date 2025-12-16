/**
 * 创建用户脚本
 * 使用方法：node scripts/create-user.js <username> <password>
 * 
 * 注意：此脚本需要在本地运行，需要安装 bcryptjs
 */

const bcrypt = require('bcryptjs');

async function createUser(username, password) {
	if (!username || !password) {
		console.error('请提供用户名和密码');
		console.log('使用方法: node scripts/create-user.js <username> <password>');
		process.exit(1);
	}

	// 生成密码哈希
	const passwordHash = await bcrypt.hash(password, 10);
	const userId = crypto.randomUUID();

	console.log('\n请执行以下 SQL 语句在 Cloudflare D1 控制台创建用户：\n');
	console.log('INSERT INTO users (id, username, password_hash) VALUES');
	console.log(`('${userId}', '${username}', '${passwordHash}');`);
	console.log('\n或者使用 Wrangler CLI：\n');
	console.log(`wrangler d1 execute cashbook-db --command "INSERT INTO users (id, username, password_hash) VALUES ('${userId}', '${username}', '${passwordHash}');"`);
	console.log('\n注意：请将 cashbook-db 替换为您的实际数据库名称\n');
}

const username = process.argv[2];
const password = process.argv[3];

createUser(username, password).catch(console.error);

