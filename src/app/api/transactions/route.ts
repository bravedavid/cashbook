import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTransactions, addTransaction } from '@/lib/transactions';
import { TransactionFormData } from '@/types';

export async function GET(_request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		const transactions = await getTransactions(user.id);

		return NextResponse.json({ success: true, transactions });
	} catch (error) {
		console.error('Get transactions error:', error);
		return NextResponse.json({ success: false, error: '获取交易记录失败' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}

		const formData: TransactionFormData = await request.json();

		const transaction = await addTransaction(user.id, {
			type: formData.type,
			amount: parseFloat(formData.amount),
			category: formData.category,
			description: formData.description,
			note: formData.note,
			date: formData.date,
		});

		return NextResponse.json({ success: true, transaction });
	} catch (error) {
		console.error('Add transaction error:', error);
		return NextResponse.json({ success: false, error: '添加交易记录失败' }, { status: 500 });
	}
}

