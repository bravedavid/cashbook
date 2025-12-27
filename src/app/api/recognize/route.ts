import { NextRequest, NextResponse } from 'next/server';
import { TransactionItem, RecognitionResponse } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { getUserCategories } from '@/lib/categories';

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

		// 获取当前用户
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json(
				{ success: false, error: '未登录' },
				{ status: 401 }
			);
		}

		// 获取用户的所有分类
		const [incomeCategories, expenseCategories] = await Promise.all([
			getUserCategories(user.id, 'income'),
			getUserCategories(user.id, 'expense'),
		]);

		// 格式化分类信息用于 prompt（使用冒号分隔，避免与自定义分类ID中的连字符冲突）
		const formatCategories = (categories: typeof incomeCategories) => {
			return categories.map(cat => `${cat.id}:${cat.name}`).join(', ');
		};

		const incomeCategoriesText = formatCategories(incomeCategories);
		const expenseCategoriesText = formatCategories(expenseCategories);

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
4. 交易类别（必须从以下类别中选择最匹配的）：
   - 收入类别：${incomeCategoriesText || 'salary-工资, bonus-奖金, investment-投资, gift-礼物, other-income-其他收入'}
   - 支出类别：${expenseCategoriesText || 'food-餐饮, transport-交通, shopping-购物, entertainment-娱乐, bills-账单, health-医疗, education-教育, other-expense-其他支出'}
   请根据交易内容选择最合适的分类ID（例如：food、salary、custom-xxx等）
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

重要提示：
- 分类ID必须完全匹配上述提供的分类列表中的ID（只返回ID部分，不要包含名称）
- 例如：如果分类是 "food:餐饮"，category 字段应该只填写 "food"，不要写成 "food-餐饮" 或 "food:餐饮"
- 如果是自定义分类，使用完整的ID（如 custom-xxx），同样只返回ID部分，不要添加名称
- 如果图片中没有交易记录或无法识别，返回空数组 []
- 只返回 JSON 数组，不要包含其他文字说明

商户名称分类规则：
- 当识别到商户名称包含"杭州潘多拉酒店管理有限公司三墩分公司"时，必须将分类设置为"餐饮"类别（category 字段应填写对应的餐饮分类ID，如 "food" 或用户自定义的餐饮分类ID）

特别注意：银行流水日期识别规则
- 银行流水通常按时间倒序列出（最新的记录在最上方，最旧的记录在最下方）
- 如果某些交易记录没有明确显示日期，需要根据上下文推断：
  * 找到图片中有明确日期的记录作为参考点
  * 如果中间某条记录有明确日期（如"2024-01-15"），那么该条记录以上的记录（在图片中位置更靠上）应该是这个日期往后加一天
  * 日期推断示例：
    - 如果第5条记录显示"2024-01-15"，第1-4条记录没有日期，那么：
      - 第1条（最上面的记录）应该是"2024-01-16"
      - 第2条应该是"2024-01-16"或"2024-01-15"
      - 第3条应该是"2024-01-15"
      - 第4条应该是"2024-01-15"
  * 优先使用图片中明确标注的日期，如果没有则根据位置关系推断
  * 确保所有交易记录都有合理的日期，不要遗漏任何记录的日期信息`,
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
				.map((t: TransactionItem) => {
					// 清理分类ID：如果分类ID包含名称部分，只保留纯ID部分
					let cleanCategory = t.category;
					
					// 处理格式：custom-xxx-名称 或 custom-xxx:名称
					// 自定义分类ID格式：custom-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（UUID格式，6段用-分隔）
					// 如果后面还有内容，那就是名称部分，需要去掉
					if (cleanCategory.startsWith('custom-')) {
						// 优先处理 custom-xxx:名称 格式（使用 : 分隔，更明确）
						// UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（5段）
						// 自定义分类ID：custom-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（6段）
						const colonMatch = cleanCategory.match(/^(custom-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}):(.+)$/);
						if (colonMatch) {
							cleanCategory = colonMatch[1];
						} else {
							// 处理 custom-xxx-名称 格式（使用 - 分隔）
							const parts = cleanCategory.split('-');
							// UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（5段）
							// 加上custom前缀，总共6段
							// 如果超过6段，多出来的就是名称部分
							if (parts.length > 6) {
								// 提取前6段作为纯ID（custom + UUID的5段）
								cleanCategory = parts.slice(0, 6).join('-');
							}
						}
					} else {
						// 对于系统分类，也可能有类似问题，尝试清理
						// 系统分类格式：id-名称 或 id:名称
						const systemMatch = cleanCategory.match(/^([a-z-]+)[-:](.+)$/);
						if (systemMatch) {
							// 检查是否是有效的系统分类ID
							const systemIds = ['salary', 'bonus', 'investment', 'gift', 'other-income', 'food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other-expense'];
							if (systemIds.includes(systemMatch[1])) {
								cleanCategory = systemMatch[1];
							}
						}
					}

					return {
						date: t.date,
						amount: Math.abs(t.amount),
						type: t.type,
						category: cleanCategory,
						description: t.description || '',
						originalInfo: t.originalInfo || '',
					};
				});
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

