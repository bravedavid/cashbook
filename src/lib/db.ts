import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getD1Database() {
	try {
		const context = getCloudflareContext();
		if (!context) {
			console.error('[DB] Cloudflare context not available');
			throw new Error('Cloudflare context not available');
		}
		if (!context.env) {
			console.error('[DB] Cloudflare env not available');
			throw new Error('Cloudflare env not available');
		}
		if (!context.env.DB) {
			console.error('[DB] D1 database binding not found in env');
			throw new Error('D1 database not configured');
		}
		console.log('[DB] D1 database connection successful');
		return context.env.DB;
	} catch (error) {
		console.error('[DB] Error getting D1 database:', error);
		if (error instanceof Error) {
			console.error('[DB] Error message:', error.message);
			console.error('[DB] Error stack:', error.stack);
		}
		throw error;
	}
}

