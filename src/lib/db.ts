import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getD1Database() {
	const context = getCloudflareContext();
	if (!context?.env?.DB) {
		throw new Error('D1 database not configured');
	}
	return context.env.DB;
}

