# X2MD Lite

一个可以部署到 Cloudflare Pages 的轻量级工具站：输入公开的 X / Twitter 帖子链接，提取内容并生成 Markdown，支持页面预览、复制和下载 `.md` 文件。

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- react-markdown
- remark-gfm
- Cloudflare Pages Functions

## 功能说明

- 支持 `https://x.com/.../status/...` 和 `https://twitter.com/.../status/...`
- 前端校验链接格式
- 后端通过可替换的 Provider 结构原生调用 X API v2
- 未配置 `X_API_BEARER_TOKEN` 时自动返回 mock 数据，方便本地开发
- 生成 Markdown 原文与图文预览
- 支持复制 Markdown 和下载 `.md` 文件

## 项目结构

```text
x2md-lite/
├── functions/
│   └── api/
│       └── extract.ts
├── src/
│   ├── lib/
│   ├── server/
│   │   ├── providers/
│   │   └── utils/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

## 安装依赖

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

说明：

- `npm run dev` 会启动 Vite 开发服务器。
- 开发模式下已内置 `/api/extract` 本地中间件，方便直接联调。
- 如果没有配置 `X_API_BEARER_TOKEN`，页面会使用 mock 数据完成整条流程。

## Cloudflare 本地预览

先构建静态资源：

```bash
npm run build
```

然后运行：

```bash
npx wrangler pages dev dist
```

如果项目根目录存在 `wrangler.toml`，Wrangler 会读取 Pages 配置并挂载 `functions/` 目录中的函数。

## 构建

```bash
npm run build
```

## 部署

```bash
npx wrangler pages deploy dist --project-name x2md-lite
```

首次部署前，如果还没有对应的 Pages 项目，可以先创建：

```bash
npx wrangler pages project create x2md-lite
```

## 环境变量

在 Cloudflare Pages 项目设置中，或本地 `.dev.vars` / shell 环境中配置：

```bash
X_API_BEARER_TOKEN=X API v2 Bearer Token
```

兼容说明：

- 现在推荐使用 `X_API_BEARER_TOKEN`
- 旧变量 `X_EXTRACT_API_KEY` 仍然可以作为 Bearer Token 的兼容别名

默认 Provider 会直接请求 X API v2：

```bash
GET https://api.x.com/2/tweets/{postId}
```

并附带以下查询参数：

```text
expansions=author_id,attachments.media_keys
tweet.fields=created_at,author_id,attachments,text
user.fields=name,username
media.fields=type,url,preview_image_url
```

同时自动附带请求头：

```text
Authorization: Bearer <X_API_BEARER_TOKEN>
Accept: application/json
```

Provider 会从 X API v2 响应中提取：

- 帖子正文 `data.text`
- 发布时间 `data.created_at`
- 作者信息 `includes.users`
- 图片信息 `includes.media`

当前只将 `photo` 类型媒体转换成 Markdown 图片，视频和 GIF 不会被下载或渲染为媒体 section。

## Markdown 生成规则

输出结构如下：

```md
# {title}

> 作者：{authorName} {authorHandle}
> 发布时间：{publishedAt}
> 来源：{sourceUrl}

## 原文内容

{content}

## 媒体内容

![image 1]({imageUrl})

## 原始链接

{sourceUrl}
```

没有图片时不会生成 `媒体内容` section。

## 文件名规则

- 优先使用提取结果中的 `title`
- 否则从正文中截取标题
- 正文为空时使用 `authorHandle + postId`
- 自动去除非法字符 `/ \\ : * ? " < > |`
- 文件名总长度限制在 80 个字符以内
- 默认在末尾追加 `postId` 后 6 位，减少重名概率

## Provider 说明

`src/server/providers/xProvider.ts` 默认策略：

- 如果未配置 `X_API_BEARER_TOKEN`，返回 mock 数据
- 如果已配置，则通过 `fetch()` 原生调用 X API v2
- 通过 adapter 将官方响应映射为统一的 `ExtractedXData`

这能保证前端和 Markdown 逻辑保持不变。如果未来你想切回别的 Provider，只需要改这一层。
