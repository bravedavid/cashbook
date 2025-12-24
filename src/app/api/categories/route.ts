import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserCategories, addCategory, getAllUserCategories } from '@/lib/categories';

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') as 'income' | 'expense' | null;

		if (type) {
			const categories = await getUserCategories(user.id, type);
			return NextResponse.json({ success: true, categories });
		} else {
			const categories = await getAllUserCategories(user.id);
			return NextResponse.json({ success: true, categories });
		}
	} catch (error) {
		console.error('Get categories error:', error);
		return NextResponse.json({ success: false, error: '获取分类失败' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		const body = await request.json();
		const { type, name, icon, color } = body as {
			type: 'income' | 'expense';
			name: string;
			icon: string;
			color: string;
		};

		if (!type || !name || !icon || !color) {
			return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
		}

		const category = await addCategory(user.id, { type, name, icon, color });

		return NextResponse.json({ success: true, category });
	} catch (error) {
		console.error('Add category error:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '添加分类失败' },
			{ status: 500 }
		);
	}
}

