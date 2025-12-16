import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteTransaction, updateTransaction } from '@/lib/transactions';
import { Transaction } from '@/types';

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
		await deleteTransaction(user.id, id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Delete transaction error:', error);
		return NextResponse.json({ success: false, error: '删除交易记录失败' }, { status: 500 });
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
		const updates = (await request.json()) as Partial<Omit<Transaction, 'id' | 'createdAt' | 'user_id'>>;

		await updateTransaction(user.id, id, updates);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Update transaction error:', error);
		return NextResponse.json({ success: false, error: '更新交易记录失败' }, { status: 500 });
	}
}

