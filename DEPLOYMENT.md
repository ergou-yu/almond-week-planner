# 部署和在线分享说明

这个项目要实现“账号登录同步 + 在线分享链接”，推荐组合是：

- GitHub：保存代码。
- Supabase：账号、数据库、分享状态同步。
- Vercel：部署 Next.js 网站并生成公网 URL。

Coze/扣子更适合做 AI Bot 或工作流，不适合直接托管这个 Next.js 网站和数据库 API。

## 1. 创建 Supabase 后端

1. 打开 Supabase，新建项目。
2. 进入 SQL Editor，执行 `supabase/schema.sql`。
3. 进入 Project Settings，复制：
   - Project URL
   - anon public key
   - service_role key
4. 如果你希望注册后立刻登录，Authentication 里可以先关闭邮箱确认；如果开启邮箱确认，网站会先让用户进入本地模式。

## 2. 配置环境变量

本地开发时复制：

```bash
cp .env.example .env.local
```

填入：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
OPENAI_API_KEY=你的 OpenAI API key
OPENAI_TEXT_MODEL=gpt-5.4
OPENAI_IMAGE_MODEL=gpt-image-2
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

部署到 Vercel 后，把 `NEXT_PUBLIC_APP_URL` 改成你的正式域名，例如：

```bash
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

## 3. 推到 GitHub

如果这个目录还不是 Git 仓库：

```bash
git init
git add .
git commit -m "Initial weekly planner app"
git branch -M main
```

然后在 GitHub 新建一个空仓库，把远程地址替换成你的仓库地址：

```bash
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

## 4. 部署到 Vercel

1. 在 Vercel 选择 `Add New Project`。
2. 导入 GitHub 仓库。
3. Framework 选择 Next.js。
4. 添加 `.env.example` 里的环境变量。
5. 点击 Deploy。

部署完成后，Vercel 会给你一个 URL，例如：

```text
https://your-project.vercel.app
```

## 5. 在线分享链接怎么用

在线协作链接依赖 Supabase 云端数据库，流程是：

1. 访问部署后的 Vercel URL。
2. 注册或登录真实账号。
3. 创建或编辑周计划。
4. 点击“立即同步”。
5. 点击“生成在线协作链接”。
6. 复制生成的 `/share/...` 链接发给家长、老师或同伴。

别人打开这个链接后，可以修改任务完成状态和评价。状态会写回数据库，所以换设备、刷新页面后不会丢。

如果没有配置 Supabase，不能生成在线链接，只能用“导出独立 HTML”分享一个离线文件。
