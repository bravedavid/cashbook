import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteCategory, updateCategory } from '@/lib/categories';
import { Category } from '@/types';

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		const { id } = await params;
		await deleteCategory(user.id, id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Delete category error:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '删除分类失败' },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		const { id } = await params;
		const updates = (await request.json()) as Partial<Pick<Category, 'name' | 'icon' | 'color'>>;

		await updateCategory(user.id, id, updates);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Update category error:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '更新分类失败' },
			{ status: 500 }
		);
	}
}

