import { NextRequest, NextResponse } from 'next/server';
import { TransactionItem, RecognitionResponse } from '@/types';

interface RecognitionRequest {
	imageBase64: string;
	apiKey?: string;
	model?: string;
}

interface OpenRouterResponse {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
}

export async function POST(request: NextRequest) {
	try {
		const { imageBase64, apiKey: clientApiKey, model: clientModel }: RecognitionRequest = await request.json();

		if (!imageBase64) {
			return NextResponse.json(
				{ success: false, error: '图片数据不能为空' },
				{ status: 400 }
			);
		}

		// 获取 OpenRouter API Key（优先使用客户端提供的，否则使用环境变量）
		const apiKey = clientApiKey || process.env.OPENROUTER_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ success: false, error: 'OpenRouter API Key 未配置，请在设置页面配置 API Key' },
				{ status: 500 }
			);
		}

		// 获取模型（优先使用客户端提供的，否则使用默认值）
		const model = clientModel || 'openai/gpt-4o';

		// 调用 OpenRouter API (使用 GPT-4 Vision 或 Claude 3)
		const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
				'X-Title': 'Cashbook',
			},
			body: JSON.stringify({
				model: model, // 使用用户选择的模型
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: `请仔细分析这张银行流水图片，识别出所有的交易记录。对于每笔交易，请提取以下信息：
1. 交易日期（格式：YYYY-MM-DD）
2. 交易金额（数字）
3. 交易类型（income 表示收入，expense 表示支出）
4. 交易类别（从以下类别中选择最匹配的：food-餐饮, transport-交通, shopping-购物, entertainment-娱乐, bills-账单, health-医疗, education-教育, salary-工资, bonus-奖金, investment-投资, gift-礼物, other-income-其他收入, other-expense-其他支出）
5. 交易描述（简要描述交易内容）
6. 原始交易信息（originalInfo）：从图片中提取的原始交易文本信息，包括商户名称、交易对手、备注等完整信息，用于后续参考

请以 JSON 数组格式返回，格式如下：
[
  {
    "date": "2024-01-15",
    "amount": 50.00,
    "type": "expense",
    "category": "food",
    "description": "午餐",
    "originalInfo": "2024-01-15 12:30 支付宝-XX餐厅 消费 ¥50.00 余额: ¥1,234.56"
  },
  {
    "date": "2024-01-15",
    "amount": 2000.00,
    "type": "income",
    "category": "salary",
    "description": "工资",
    "originalInfo": "2024-01-15 09:00 工资发放 转入 ¥2,000.00 余额: ¥3,234.56"
  }
]

如果图片中没有交易记录或无法识别，返回空数组 []。只返回 JSON 数组，不要包含其他文字说明。`,
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:image/jpeg;base64,${imageBase64}`,
								},
							},
						],
					},
				],
				temperature: 0.3,
			}),
		});

		if (!openRouterResponse.ok) {
			const errorText = await openRouterResponse.text();
			console.error('OpenRouter API Error:', errorText);
			return NextResponse.json(
				{ success: false, error: `OpenRouter API 调用失败: ${openRouterResponse.statusText}` },
				{ status: 500 }
			);
		}

		const openRouterData = (await openRouterResponse.json()) as OpenRouterResponse;
		const content = openRouterData.choices?.[0]?.message?.content;

		if (!content) {
			return NextResponse.json(
				{ success: false, error: '无法获取识别结果' },
				{ status: 500 }
			);
		}

		// 解析 JSON 响应
		let transactions: TransactionItem[] = [];
		try {
			// 尝试提取 JSON 数组（可能包含 markdown 代码块）
			const jsonMatch = content.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				transactions = JSON.parse(jsonMatch[0]);
			} else {
				transactions = JSON.parse(content);
			}

			// 验证和清理数据
			transactions = transactions
				.filter((t: unknown): t is TransactionItem => {
					return (
						typeof t === 'object' &&
						t !== null &&
						'date' in t &&
						'amount' in t &&
						'type' in t &&
						'category' in t &&
						'description' in t &&
						typeof (t as TransactionItem).date === 'string' &&
						typeof (t as TransactionItem).amount === 'number' &&
						((t as TransactionItem).type === 'income' || (t as TransactionItem).type === 'expense') &&
						typeof (t as TransactionItem).category === 'string' &&
						typeof (t as TransactionItem).description === 'string'
					);
				})
				.map((t: TransactionItem) => ({
					date: t.date,
					amount: Math.abs(t.amount),
					type: t.type,
					category: t.category,
					description: t.description || '',
					originalInfo: t.originalInfo || '',
				}));
		} catch (parseError) {
			console.error('JSON 解析错误:', parseError);
			console.error('原始内容:', content);
			return NextResponse.json(
				{ success: false, error: '识别结果格式错误，无法解析' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			transactions,
		} as RecognitionResponse);
	} catch (error) {
		console.error('识别错误:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '未知错误' },
			{ status: 500 }
		);
	}
}

