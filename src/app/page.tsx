"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Transaction,
  TransactionFormData,
  AuthMeResponse,
  TransactionsResponse,
  TransactionResponse,
  DeleteResponse,
} from "@/types";
import { calculateTotal, calculateBalance } from "@/lib/utils";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import TransactionFilter, {
  FilterOptions,
} from "@/components/TransactionFilter";
import StatsCard from "@/components/StatsCard";
import {
  BarChart3,
  Upload,
  Settings,
  LogOut,
  User,
  List,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    category: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });
  const [viewMode, setViewMode] = useState<"list" | "monthly">("list");

  useEffect(() => {
    loadUser();
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data: AuthMeResponse = await response.json();
      if (data.success) {
        setUser(data.user || null);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
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

  const handleAddTransaction = async (formData: TransactionFormData) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: TransactionResponse = await response.json();
      if (data.success) {
        setTransactions([data.transaction!, ...transactions]);
        setShowForm(false);
      } else {
        alert("添加失败：" + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
      alert("添加失败，请稍后重试");
    }
  };

  const handleUpdateTransaction = async (
    id: string,
    formData: TransactionFormData
  ) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          note: formData.note,
          date: formData.date,
        }),
      });

      const data: DeleteResponse = await response.json();
      if (data.success) {
        // 重新加载交易记录
        await loadTransactions();
      } else {
        alert("更新失败：" + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
      alert("更新失败，请稍后重试");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      const data: DeleteResponse = await response.json();
      if (data.success) {
        setTransactions(transactions.filter((t) => t.id !== id));
      } else {
        alert("删除失败：" + (data.error || "未知错误"));
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("删除失败，请稍后重试");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({
      type: "all",
      category: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
    });
  };

  // 筛选交易记录 - 必须在所有条件返回之前调用
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 类型筛选
    if (filters.type !== "all") {
      result = result.filter((t) => t.type === filters.type);
    }

    // 分类筛选
    if (filters.category) {
      result = result.filter((t) => t.category === filters.category);
    }

    // 金额筛选
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      if (!isNaN(minAmount)) {
        result = result.filter((t) => t.amount >= minAmount);
      }
    }
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      if (!isNaN(maxAmount)) {
        result = result.filter((t) => t.amount <= maxAmount);
      }
    }

    // 日期筛选
    if (filters.startDate) {
      result = result.filter((t) => t.date >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter((t) => t.date <= filters.endDate);
    }

    // 按日期排序
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filters]);

  const income = calculateTotal(filteredTransactions, "income");
  const expense = calculateTotal(filteredTransactions, "expense");
  const balance = calculateBalance(filteredTransactions);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 头部导航 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              记账本
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              记录每一笔收支，掌控你的财务状况
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700/50 rounded-full border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.username}
                </span>
              </div>
            )}
            <Link
              href="/stats"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <BarChart3 className="w-5 h-5" />
              统计
            </Link>
            <Link
              href="/settings"
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors duration-200"
              title="设置"
            >
              <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors duration-200"
              title="登出"
            >
              <LogOut className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          <StatsCard title="总收入" amount={income} type="income" />
          <StatsCard title="总支出" amount={expense} type="expense" />
          <StatsCard title="余额" amount={balance} type="balance" />
        </div>

        {/* 添加记录表单或按钮 */}
        {showForm ? (
          <div className="mb-8">
            <TransactionForm
              onSubmit={handleAddTransaction}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            <button
              onClick={() => setShowForm(true)}
              className="py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-lg sm:text-base"
            >
              + 添加新记录
            </button>
            <Link
              href="/import"
              className="py-4 sm:py-5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg sm:text-base"
            >
              <Upload className="w-5 h-5" />
              导入银行流水
            </Link>
          </div>
        )}

        {/* 筛选器 */}
        <TransactionFilter
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
        />

        {/* 交易列表 */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              交易记录
              {filteredTransactions.length !== transactions.length && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredTransactions.length}/{transactions.length})
                </span>
              )}
            </h2>
            {/* 视图切换按钮 */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/30 rounded-full p-1 border border-gray-200 dark:border-gray-600/30">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-600/50 text-gray-900 dark:text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">列表</span>
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  viewMode === "monthly"
                    ? "bg-white dark:bg-gray-600/50 text-gray-900 dark:text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">按月</span>
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <TransactionList
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              onUpdate={handleUpdateTransaction}
              viewMode={viewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
