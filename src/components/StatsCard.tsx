"use client";

import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface StatsCardProps {
  title: string;
  amount: number;
  type: "income" | "expense" | "balance";
}

export default function StatsCard({ title, amount, type }: StatsCardProps) {
  const gradients = {
    income:
      "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/40",
    expense:
      "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800/40",
    balance:
      "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800/40",
  };

  const bgColors = {
    income: "bg-green-100/50 dark:bg-green-900/30",
    expense: "bg-red-100/50 dark:bg-red-900/30",
    balance: "bg-blue-100/50 dark:bg-blue-900/30",
  };

  const textColors = {
    income: "text-green-700 dark:text-green-400",
    expense: "text-red-700 dark:text-red-400",
    balance: "text-blue-700 dark:text-blue-400",
  };

  const icons = {
    income: TrendingUp,
    expense: TrendingDown,
    balance: Wallet,
  };

  const Icon = icons[type];

  return (
    <div
      className={`${gradients[type]} border rounded-2xl p-6 sm:p-8 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </span>
        <div className={`${bgColors[type]} p-2.5 rounded-full`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${textColors[type]}`} />
        </div>
      </div>
      <div className={`text-3xl sm:text-4xl font-bold ${textColors[type]}`}>
        {formatCurrency(amount)}
      </div>
    </div>
  );
}
