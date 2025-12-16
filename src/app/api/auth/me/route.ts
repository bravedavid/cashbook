import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		return NextResponse.json({ success: true, user });
	} catch (error) {
		console.error('Get current user error:', error);
		return NextResponse.json({ success: false, error: '获取用户信息失败' }, { status: 500 });
	}
}

