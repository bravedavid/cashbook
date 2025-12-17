'use client';

import { useState, useEffect } from 'react';
import { Category, CategoriesResponse } from '@/types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';

interface UseCategoriesResult {
	incomeCategories: Category[];
	expenseCategories: Category[];
	loading: boolean;
	refresh: () => void;
}

export function useCategories(): UseCategoriesResult {
	const [incomeCategories, setIncomeCategories] = useState<Category[]>(INCOME_CATEGORIES);
	const [expenseCategories, setExpenseCategories] = useState<Category[]>(EXPENSE_CATEGORIES);
	const [loading, setLoading] = useState(true);

	const loadCategories = async () => {
		try {
			const [incomeRes, expenseRes] = await Promise.all([
				fetch('/api/categories?type=income'),
				fetch('/api/categories?type=expense'),
			]);

			const incomeData = (await incomeRes.json()) as CategoriesResponse;
			const expenseData = (await expenseRes.json()) as CategoriesResponse;

			if (incomeData.success) {
				setIncomeCategories(incomeData.categories || INCOME_CATEGORIES);
			}
			if (expenseData.success) {
				setExpenseCategories(expenseData.categories || EXPENSE_CATEGORIES);
			}
		} catch (error) {
			console.error('Failed to load categories:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadCategories();
	}, []);

	return {
		incomeCategories,
		expenseCategories,
		loading,
		refresh: loadCategories,
	};
}

