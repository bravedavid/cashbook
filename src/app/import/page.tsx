"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// 强制动态渲染，避免预渲染错误
export const dynamic = "force-dynamic";
import {
  RecognitionResult,
  TransactionItem,
  RecognitionResponse,
} from "@/types";
import { fileToBase64 } from "@/lib/imageUtils";
import { settings } from "@/lib/settings";
import ImageUpload from "@/components/ImageUpload";
import RecognitionItem from "@/components/RecognitionItem";
import { ArrowLeft, CheckCircle2, Settings, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ImportPage() {
  const [recognitionResults, setRecognitionResults] = useState<
    RecognitionResult[]
  >([]);
  const [savedCount, setSavedCount] = useState<number>(0);
  const isProcessingRef = useRef(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const appSettings = settings.getSettings();
    setHasApiKey(!!appSettings.openRouterApiKey);
  }, []);

  const recognizeImage = useCallback(async (result: RecognitionResult) => {
    try {
      const appSettings = settings.getSettings();

      if (!appSettings.openRouterApiKey) {
        setRecognitionResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "error" as const,
                  error: "请先在设置页面配置 OpenRouter API Key",
                }
              : r
          )
        );
        return;
      }

      const base64 = await fileToBase64(result.imageFile);
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          apiKey: appSettings.openRouterApiKey,
          model: appSettings.model,
        }),
      });

      const data = (await response.json()) as RecognitionResponse;

      if (data.success && data.transactions) {
        setRecognitionResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "success" as const,
                  transactions: data.transactions,
                }
              : r
          )
        );
      } else {
        setRecognitionResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "error" as const,
                  error: data.error || "识别失败",
                }
              : r
          )
        );
      }
    } catch (error) {
      setRecognitionResults((prev) =>
        prev.map((r) =>
          r.id === result.id
            ? {
                ...r,
                status: "error" as const,
                error: error instanceof Error ? error.message : "识别失败",
              }
            : r
        )
      );
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // 处理图片队列
  useEffect(() => {
    if (isProcessingRef.current) return;

    const pendingResults = recognitionResults.filter(
      (r) => r.status === "pending"
    );
    if (pendingResults.length === 0) {
      return;
    }

    const nextResult = pendingResults[0];
    isProcessingRef.current = true;

    // 更新状态为处理中
    setRecognitionResults((prev) =>
      prev.map((r) =>
        r.id === nextResult.id ? { ...r, status: "processing" as const } : r
      )
    );

    // 开始识别
    recognizeImage(nextResult);
  }, [recognitionResults, recognizeImage]);

  const handleImagesSelected = (files: File[]) => {
    const newResults: RecognitionResult[] = files.map((file) => ({
      id: crypto.randomUUID(),
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
      status: "pending" as const,
    }));

    setRecognitionResults((prev) => [...prev, ...newResults]);
  };

  const handleRetry = async (id: string) => {
    const result = recognitionResults.find((r) => r.id === id);
    if (!result) return;

    setRecognitionResults((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "processing" as const, error: undefined }
          : r
      )
    );

    await recognizeImage(result);
  };

  const handleConfirm = async (id: string, transactions: TransactionItem[]) => {
    // 设置保存状态，防止重复点击
    setRecognitionResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, saving: true } : r))
    );

    try {
      // 批量保存交易记录
      for (const transaction of transactions) {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: transaction.type,
            amount: transaction.amount.toString(),
            category: transaction.category,
            description: transaction.description,
            note: transaction.originalInfo || "", // 将原始交易信息保存到备注字段
            date: transaction.date,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "保存失败");
        }
      }

      setSavedCount((prev) => prev + transactions.length);

      // 移除已确认的结果
      setRecognitionResults((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to save transactions:", error);
      // 保存失败时，清除保存状态，允许重试
      setRecognitionResults((prev) =>
        prev.map((r) => (r.id === id ? { ...r, saving: false } : r))
      );
      alert(
        "保存失败：" + (error instanceof Error ? error.message : "未知错误")
      );
    }
  };

  const handleRemove = (id: string) => {
    setRecognitionResults((prev) => {
      const result = prev.find((r) => r.id === id);
      if (result) {
        URL.revokeObjectURL(result.imagePreview);
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const pendingCount = recognitionResults.filter(
    (r) => r.status === "pending" || r.status === "processing"
  ).length;
  const successCount = recognitionResults.filter(
    (r) => r.status === "success"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                导入银行流水
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                上传银行流水图片，AI 将自动识别并提取交易记录
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

        {/* API Key 未配置提示 */}
        {!hasApiKey && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 text-lg">
                需要配置 API Key
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                使用 AI 识别功能需要先配置 OpenRouter API Key。访问{" "}
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:opacity-80"
                >
                  openrouter.ai
                </a>{" "}
                获取密钥。
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                <Settings className="w-5 h-5" />
                前往设置
              </Link>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {(recognitionResults.length > 0 || savedCount > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                总图片
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {recognitionResults.length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                处理中
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                {pendingCount}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                识别成功
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                {successCount}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                已保存
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                {savedCount}
              </div>
            </div>
          </div>
        )}

        {/* 图片上传 */}
        {recognitionResults.length === 0 && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm mb-10 overflow-hidden">
            <ImageUpload onImagesSelected={handleImagesSelected} />
          </div>
        )}

        {/* 识别结果列表 */}
        {recognitionResults.length > 0 && (
          <div className="space-y-4 mb-10">
            {recognitionResults.map((result) => (
              <RecognitionItem
                key={result.id}
                result={result}
                onRetry={handleRetry}
                onConfirm={handleConfirm}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* 添加更多图片 */}
        {recognitionResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm mb-10 overflow-hidden">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
              添加更多图片
            </h3>
            <ImageUpload onImagesSelected={handleImagesSelected} />
          </div>
        )}

        {/* 完成提示 */}
        {savedCount > 0 && recognitionResults.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800/40 rounded-2xl p-8 sm:p-10 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
              成功导入 {savedCount} 条记录！
            </h3>
            <p className="text-green-800 dark:text-green-200 mb-6">
              所有交易记录已保存到你的账户
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
