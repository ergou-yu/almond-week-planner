# 杏花周计划

梵高杏花风格的周计划协作网站。支持大计划、小计划卡片、完成状态、评价区、AI 建议、互动 PDF 导出、独立 HTML 导出、账号同步和分享链接协作。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

没有配置 Supabase / OpenAI 时，网站仍可离线使用：计划会保存在当前浏览器，AI 会返回本地兜底建议，在线分享和真实账号会提示配置。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-5.4
OPENAI_IMAGE_MODEL=gpt-image-2
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`OPENAI_API_KEY` 只在服务端 API 路由使用，不会暴露给浏览器。

## Supabase 设置

1. 创建 Supabase 项目。
2. 在 Supabase SQL Editor 执行 `supabase/schema.sql`。
3. 在 Authentication 中按需要决定是否开启邮箱确认。
4. 将 Project URL、anon key、service role key 填进 `.env.local` 或 Vercel 环境变量。

数据库启用了 RLS。普通登录用户只能管理自己的计划；分享链接通过服务端 token 校验，只允许更新任务状态和评价。

## 部署到 Vercel

完整步骤见 `DEPLOYMENT.md`。简要流程：

1. 将项目推送到 GitHub。
2. 在 Supabase 执行 `supabase/schema.sql`。
3. 在 Vercel 导入 GitHub 项目，Framework 选择 Next.js。
4. 配置 `.env.example` 中列出的环境变量。
5. 将 `NEXT_PUBLIC_APP_URL` 设置为 Vercel 分配的正式 URL。
6. 部署后，用该 URL 测试注册、登录、分享链接和 PDF 下载。

## 验证项

```bash
npm run typecheck
npm run build
```

已实现的关键路径：

- 首页直接进入可编辑体验，`/dashboard` 入口明显。
- 注册/登录表单使用真实按钮和表单，微信登录保留为待配置入口。
- 小计划支持绿色高质完成、黄色基本完成、红色停止、紫色推迟。
- 分享链接默认只允许修改状态和评价。
- PDF 导出包含状态说明、可勾选状态框、评价输入区，并嵌入中文字体。
- HTML 导出生成单文件，带本地状态保存；包含分享 token 时会尝试同步在线状态。
- AI 建议在无 key 时返回可理解的本地兜底建议。

## 资源说明

- `public/assets/almond-blossom-bg.png` 是为本项目生成的杏花风格背景图。
- `public/fonts/ArialUnicode.ttf` 用于 PDF 中文、英文和数字嵌入，避免子集字体导致中文缺字。
