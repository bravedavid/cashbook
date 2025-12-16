# 记账本 (Cashbook)

一个现代化的记账应用，支持手动添加记录和 AI 识别银行流水图片。

## 功能特性

- 📝 手动添加收入/支出记录
- 📸 AI 识别银行流水图片（使用 OpenRouter 大模型）
- 📊 多种统计图表（折线图、饼图、柱状图）
- 🎨 现代化的 UI 设计，支持深色模式
- 💾 本地数据存储（localStorage）
- ☁️ 支持 Cloudflare 部署

## 环境配置

### 本地开发

1. 复制环境变量示例文件：
```bash
cp .env.example .env.local
```

2. 配置 OpenRouter API Key：
   - 访问 [OpenRouter](https://openrouter.ai/keys) 获取 API Key
   - 在 `.env.local` 文件中设置 `OPENROUTER_API_KEY`

### Cloudflare 部署

使用 Wrangler 设置环境变量：
```bash
wrangler secret put OPENROUTER_API_KEY
```

## Getting Started

Read the documentation at https://opennext.js.org/cloudflare.

## Develop

Run the Next.js development server:

```bash
npm run dev
# or similar package manager command
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Preview

Preview the application locally on the Cloudflare runtime:

```bash
npm run preview
# or similar package manager command
```

## Deploy

Deploy the application to Cloudflare:

```bash
npm run deploy
# or similar package manager command
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
