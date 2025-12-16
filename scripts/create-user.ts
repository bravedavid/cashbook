/**
 * 创建用户脚本
 * 使用方法：npx tsx scripts/create-user.ts <username> <password>
 * 
 * 注意：此脚本需要在本地运行，需要配置 D1 数据库连接
 */

import bcrypt from 'bcryptjs';

async function createUser(username: string, password: string) {
	if (!username || !password) {
		console.error('请提供用户名和密码');
		console.log('使用方法: npx tsx scripts/create-user.ts <username> <password>');
		process.exit(1);
	}

	// 生成密码哈希
	const passwordHash = await bcrypt.hash(password, 10);
	const userId = crypto.randomUUID();

	console.log('请执行以下 SQL 语句在 Cloudflare D1 控制台创建用户：');
	console.log('');
	console.log('INSERT INTO users (id, username, password_hash) VALUES');
	console.log(`('${userId}', '${username}', '${passwordHash}');`);
	console.log('');
	console.log('或者使用 Wrangler CLI：');
	console.log(`wrangler d1 execute cashbook-db --command "INSERT INTO users (id, username, password_hash) VALUES ('${userId}', '${username}', '${passwordHash}');"`);
}

const username = process.argv[2];
const password = process.argv[3];

createUser(username, password).catch(console.error);

