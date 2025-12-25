"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Transaction,
  TransactionsResponse,
  Category,
  CategoriesResponse,
} from "@/types";
import {
  calculateTotal,
  groupByCategory,
  groupByDate,
  formatCurrency,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  ArrowLeft,
  Settings,
  PieChart as PieChartIcon,
  BarChart3,
  Table,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#6b7280",
];

const formatCurrencyValue = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return formatCurrency(0);
  }
  return formatCurrency(value);
};

const formatPieLabel = (props: { name?: string; percent?: number }): string => {
  const nameValue = props.name ?? "";
  const percentValue = props.percent ?? 0;
  return `${nameValue} ${(percentValue * 100).toFixed(0)}%`;
};

// ===== 类型定义 =====

interface CategoryStatItem {
  name: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
}

interface MonthlyStatItem {
  month: string;
  fullMonth: string;
  income: number;
  expense: number;
  balance: number;
}

interface YearlyStatItem {
  year: string;
  income: number;
  expense: number;
  balance: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

type ChartViewType = "pie" | "bar" | "table";
type TabType = "overview" | "monthly" | "yearly" | "category";

// 计算月度数据
const getMonthlyStats = (transactions: Transaction[]) => {
  const monthMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, { income: 0, expense: 0 });
    }

    const month = monthMap.get(key)!;
    if (t.type === "income") {
      month.income += t.amount;
    } else {
      month.expense += t.amount;
    }
  });

  return Array.from(monthMap.entries())
    .sort()
    .map(([month, data]) => ({
      month: month.slice(5),
      fullMonth: month,
      income: parseFloat(data.income.toFixed(2)),
      expense: parseFloat(data.expense.toFixed(2)),
      balance: parseFloat((data.income - data.expense).toFixed(2)),
    }));
};

// 计算年度数据
const getYearlyStats = (transactions: Transaction[]) => {
  const yearMap = new Map<number, { income: number; expense: number }>();

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const year = date.getFullYear();

    if (!yearMap.has(year)) {
      yearMap.set(year, { income: 0, expense: 0 });
    }

    const data = yearMap.get(year)!;
    if (t.type === "income") {
      data.income += t.amount;
    } else {
      data.expense += t.amount;
    }
  });

  return Array.from(yearMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, data]) => ({
      year: year.toString(),
      income: parseFloat(data.income.toFixed(2)),
      expense: parseFloat(data.expense.toFixed(2)),
      balance: parseFloat((data.income - data.expense).toFixed(2)),
    }));
};

// 计算分类统计
const getCategoryStats = (
  transactions: Transaction[],
  type: "income" | "expense",
  categories: Category[]
) => {
  const filtered = transactions.filter((t) => t.type === type);
  const byCategory = groupByCategory(filtered, type);
  const total = calculateTotal(filtered, type);

  return byCategory
    .map((item) => {
      const category = categories.find((c) => c.id === item.category);
      return {
        name: category?.name || "未知分类",
        amount: parseFloat(item.amount.toFixed(2)),
        percentage:
          total > 0 ? parseFloat(((item.amount / total) * 100).toFixed(1)) : 0,
        icon: category?.icon || "💰",
        color: category?.color || "#6b7280",
      };
    })
    .sort((a, b) => b.amount - a.amount);
};

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [incomeView, setIncomeView] = useState<ChartViewType>("bar");
  const [expenseView, setExpenseView] = useState<ChartViewType>("bar");
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const [incomeRes, expenseRes] = await Promise.all([
        fetch("/api/categories?type=income"),
        fetch("/api/categories?type=expense"),
      ]);
      const incomeData = (await incomeRes.json()) as CategoriesResponse;
      const expenseData = (await expenseRes.json()) as CategoriesResponse;
      const categories = [
        ...(incomeData.success ? incomeData.categories || [] : []),
        ...(expenseData.success ? expenseData.categories || [] : []),
      ];
      setAllCategories(categories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      const data: TransactionsResponse = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (activeTab === "yearly") {
      return transactions;
    }
    const year = parseInt(selectedYear);
    return transactions.filter((t) => new Date(t.date).getFullYear() === year);
  }, [transactions, selectedYear, activeTab]);

  // 计算统计数据
  const income = calculateTotal(filteredTransactions, "income");
  const expense = calculateTotal(filteredTransactions, "expense");
  const balance = income - expense;

  const monthlyStats = getMonthlyStats(filteredTransactions);
  const yearlyStats = getYearlyStats(transactions);
  const dailyData = groupByDate(filteredTransactions);

  // 用于计算分类统计的中间变量
  groupByCategory(filteredTransactions, "income");
  groupByCategory(filteredTransactions, "expense");

  const incomeCategoryStats = getCategoryStats(
    filteredTransactions,
    "income",
    allCategories
  );
  const expenseCategoryStats = getCategoryStats(
    filteredTransactions,
    "expense",
    allCategories
  );

  // 处理分类图表数据
  const incomeChartData = incomeCategoryStats
    .slice(0, 8)
    .map((cat) => ({ name: cat.name, value: cat.amount }));
  const expenseChartData = expenseCategoryStats
    .slice(0, 8)
    .map((cat) => ({ name: cat.name, value: cat.amount }));

  const availableYears = Array.from(
    new Set(transactions.map((t) => new Date(t.date).getFullYear()))
  )
    .sort((a, b) => b - a)
    .map((y) => y.toString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="flex items-start gap-4">
            <Link
              href="/"
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors duration-200 mt-0.5"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </Link>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                财务分析
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                深度分析你的消费习惯和收入支出
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors duration-200"
            title="设置"
          >
            <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Link>
        </div>

        {/* 标签导航 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "总览", icon: "📊" },
            { id: "monthly", label: "月度对比", icon: "📈" },
            { id: "yearly", label: "年度统计", icon: "📅" },
            { id: "category", label: "分类分析", icon: "🏷️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:border-blue-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 年份选择器（用于monthly和category标签） */}
        {(activeTab === "monthly" || activeTab === "category") && (
          <div className="mb-8 flex gap-2 flex-wrap">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              选择年份：
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                      selectedYear === year
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:border-blue-300"
                    }`}
                  >
                    {year}
                  </button>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  暂无数据
                </span>
              )}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        {activeTab === "overview" && (
          <OverviewTab
            income={income}
            expense={expense}
            balance={balance}
            dailyData={dailyData}
            incomeChartData={incomeChartData}
            expenseChartData={expenseChartData}
            incomeView={incomeView}
            setIncomeView={setIncomeView}
            expenseView={expenseView}
            setExpenseView={setExpenseView}
            incomeCategoryStats={incomeCategoryStats}
            expenseCategoryStats={expenseCategoryStats}
          />
        )}

        {activeTab === "monthly" && <MonthlyTab monthlyStats={monthlyStats} />}

        {activeTab === "yearly" && <YearlyTab yearlyStats={yearlyStats} />}

        {activeTab === "category" && (
          <CategoryTab
            incomeCategoryStats={incomeCategoryStats}
            expenseCategoryStats={expenseCategoryStats}
            income={income}
            expense={expense}
          />
        )}
      </div>
    </div>
  );
}

// ===== 标签页组件 =====

function OverviewTab({
  income,
  expense,
  balance,
  dailyData,
  incomeChartData,
  expenseChartData,
  incomeView,
  setIncomeView,
  expenseView,
  setExpenseView,
  incomeCategoryStats,
  expenseCategoryStats,
}: {
  income: number;
  expense: number;
  balance: number;
  dailyData: Array<{ date: string; income: number; expense: number }>;
  incomeChartData: Array<{ name: string; value: number }>;
  expenseChartData: Array<{ name: string; value: number }>;
  incomeView: ChartViewType;
  setIncomeView: (view: ChartViewType) => void;
  expenseView: ChartViewType;
  setExpenseView: (view: ChartViewType) => void;
  incomeCategoryStats: Array<{
    name: string;
    amount: number;
    percentage: number;
    icon: string;
    color: string;
  }>;
  expenseCategoryStats: Array<{
    name: string;
    amount: number;
    percentage: number;
    icon: string;
    color: string;
  }>;
}) {
  return (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-green-200 dark:border-green-800/40 transition-all duration-200 hover:shadow-xl hover:scale-105">
          <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            总收入
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-green-700 dark:text-green-400">
            {formatCurrency(income)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-red-200 dark:border-red-800/40 transition-all duration-200 hover:shadow-xl hover:scale-105">
          <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            总支出
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-red-700 dark:text-red-400">
            {formatCurrency(expense)}
          </div>
        </div>
        <div
          className={`bg-gradient-to-br ${
            balance >= 0
              ? "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800/40"
              : "from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800/40"
          } rounded-2xl p-6 sm:p-8 shadow-lg border transition-all duration-200 hover:shadow-xl hover:scale-105`}
        >
          <div
            className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
              balance >= 0
                ? "text-blue-700 dark:text-blue-400"
                : "text-orange-700 dark:text-orange-400"
            }`}
          >
            <span>{balance >= 0 ? "💰" : "⚠️"}</span>
            余额
          </div>
          <div
            className={`text-3xl sm:text-4xl font-bold ${
              balance >= 0
                ? "text-blue-700 dark:text-blue-400"
                : "text-orange-700 dark:text-orange-400"
            }`}
          >
            {formatCurrency(balance)}
          </div>
        </div>
      </div>

      {/* 每日趋势图 */}
      {dailyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            每日收支趋势
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={formatCurrencyValue}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="收入"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="支出"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 收入和支出分类 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {incomeChartData.length > 0 && (
          <ChartCard
            title="收入分类分布"
            data={incomeChartData}
            view={incomeView}
            setView={setIncomeView}
            tableData={incomeCategoryStats}
            type="income"
          />
        )}
        {expenseChartData.length > 0 && (
          <ChartCard
            title="支出分类分布"
            data={expenseChartData}
            view={expenseView}
            setView={setExpenseView}
            tableData={expenseCategoryStats}
            type="expense"
          />
        )}
      </div>
    </div>
  );
}

function MonthlyTab({ monthlyStats }: { monthlyStats: MonthlyStatItem[] }) {
  if (monthlyStats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>该年份暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 月度对比图表 */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          月度收支对比
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={monthlyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={formatCurrencyValue}
            />
            <Legend />
            <Bar
              dataKey="income"
              fill="#10b981"
              name="收入"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="expense"
              fill="#ef4444"
              name="支出"
              radius={[8, 8, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              name="余额"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 月度详细表格 */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            月度详细统计
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  月份
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  收入
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  支出
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  余额
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  趋势
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((month, index) => {
                const prevMonth = index > 0 ? monthlyStats[index - 1] : null;
                const trend = prevMonth ? month.balance - prevMonth.balance : 0;
                return (
                  <tr
                    key={month.fullMonth}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(month.income)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(month.expense)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right text-sm font-semibold ${
                        month.balance >= 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {formatCurrency(month.balance)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          trend >= 0
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {trend >= 0 ? "↑" : "↓"}
                        {formatCurrency(Math.abs(trend))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function YearlyTab({ yearlyStats }: { yearlyStats: YearlyStatItem[] }) {
  if (yearlyStats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 年度对比图表 */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          年度收支对比
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={yearlyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={formatCurrencyValue}
            />
            <Legend />
            <Bar
              dataKey="income"
              fill="#10b981"
              name="收入"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="expense"
              fill="#ef4444"
              name="支出"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="balance"
              fill="#3b82f6"
              name="余额"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 年度详细表格 */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            年度详细统计
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  年份
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  收入
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  支出
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  余额
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  月均支出
                </th>
              </tr>
            </thead>
            <tbody>
              {yearlyStats.map((year) => (
                <tr
                  key={year.year}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {year.year}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(year.income)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(year.expense)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right text-sm font-semibold ${
                      year.balance >= 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {formatCurrency(year.balance)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(year.expense / 12)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CategoryStatItem {
  name: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
}

function CategoryTab({
  incomeCategoryStats,
  expenseCategoryStats,
  income,
  expense,
}: {
  incomeCategoryStats: CategoryStatItem[];
  expenseCategoryStats: CategoryStatItem[];
  income: number;
  expense: number;
}) {
  return (
    <div className="space-y-8">
      {/* 收入分类详情 */}
      {incomeCategoryStats.length > 0 && (
        <CategoryTableCard
          title="收入分类详情"
          data={incomeCategoryStats}
          total={income}
          type="income"
        />
      )}

      {/* 支出分类详情 */}
      {expenseCategoryStats.length > 0 && (
        <CategoryTableCard
          title="支出分类详情"
          data={expenseCategoryStats}
          total={expense}
          type="expense"
        />
      )}
    </div>
  );
}

interface ChartDataItem {
  name: string;
  value: number;
}

function ChartCard({
  title,
  data,
  view,
  setView,
  tableData,
  type,
}: {
  title: string;
  data: ChartDataItem[];
  view: ChartViewType;
  setView: (view: ChartViewType) => void;
  tableData: CategoryStatItem[];
  type: "income" | "expense";
}) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700/30 rounded-full p-1 border border-gray-200 dark:border-gray-600/30">
          <button
            onClick={() => setView("pie")}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              view === "pie"
                ? "bg-white dark:bg-gray-600/50 text-blue-600 dark:text-blue-400 shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="饼图"
          >
            <PieChartIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("bar")}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              view === "bar"
                ? "bg-white dark:bg-gray-600/50 text-blue-600 dark:text-blue-400 shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="柱状图"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              view === "table"
                ? "bg-white dark:bg-gray-600/50 text-blue-600 dark:text-blue-400 shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="表格"
          >
            <Table className="w-5 h-5" />
          </button>
        </div>
      </div>

      {view === "pie" && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={formatPieLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={formatCurrencyValue} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {view === "bar" && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={formatCurrencyValue}
            />
            <Bar
              dataKey="value"
              fill={type === "income" ? "#10b981" : "#ef4444"}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {view === "table" && tableData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  分类
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  金额
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  占比
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    {item.name}
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-semibold ${
                      type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            type === "income"
                              ? "bg-gradient-to-r from-green-400 to-green-600"
                              : "bg-gradient-to-r from-red-400 to-red-600"
                          }`}
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoryTableCard({
  title,
  data,
  total,
  type,
}: {
  title: string;
  data: CategoryStatItem[];
  total: number;
  type: "income" | "expense";
}) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700/50">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                分类
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                金额
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                占比
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                可视化
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.name}</span>
                </td>
                <td
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400 font-semibold">
                  {item.percentage}%
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        type === "income"
                          ? "bg-gradient-to-r from-green-400 to-emerald-600"
                          : "bg-gradient-to-r from-red-400 to-pink-600"
                      }`}
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
