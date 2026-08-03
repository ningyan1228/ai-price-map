# AI情报地图（AI Intelligence Map）

一个面向中文用户的静态优先 AI 情报与订阅价格查询站：**每天看 AI 新闻，订 GPT 前先查价格。**

本仓库已包含可以部署的 MVP：Astro 中文站点、价格地图/详情页、AI 快讯/详情页、工具对比、价格变化记录、静态数据维护、GitHub Pages 工作流，以及可选的 Fastify 公开数据代理。

## 功能与边界

- 首页展示 AI 快讯、ChatGPT 地区价格雷达、近期价格变化、工具对比。
- 首期价格覆盖美国、中国香港、日本、新加坡、英国、欧元区、加拿大、澳大利亚、韩国、印度、土耳其、巴西，并有 Plus、Pro、Business 样例。
- 价格页支持套餐筛选、地区卡片/表格视图、按人民币/地区/货币排序；移动端表格可横向滑动。
- 每条新闻有独立 URL、中文短摘要和原始来源链接；不转载原文全文。
- 站点只使用公开资料，不实现或引导地区绕过、虚假地址、代充、规避税费或其他违反平台规则的行为。
- 无账号、无用户上传、无用户数据库。未来“收藏地区、价格提醒”可在前端接入匿名本地存储或另行添加合规账户系统。

## 技术栈

- 前端：Astro 5、TypeScript、Tailwind CSS、原生轻量交互/SVG 图表。
- 托管：GitHub Pages（静态构建）。
- 可选 API：Node.js 20 + Fastify，带 CORS、内存缓存、限流和健康检查。
- 数据：仓库内 JSON，Git 历史就是可审阅、可回滚的价格历史。
- 更新：GitHub Actions 每日运行公开汇率与 RSS 抓取；失败不会影响已部署站点。

## 本地运行

需要 Node.js 22 或更高版本。

```bash
pnpm install
copy .env.example .env
pnpm dev
```

浏览器打开终端显示的本地地址（默认 `http://localhost:4321`）。生产检查和构建：

```bash
pnpm check
pnpm build
pnpm preview
```

`dist/` 是可直接部署的静态文件，已被 Git 忽略。

## 数据维护

所有数据位于 [`data/`](data/)；提交前请确保信息来自公开、合规来源，并填写来源链接与核验时间。

| 文件 | 作用 | 关键字段 |
| --- | --- | --- |
| `prices.json` | 各地区套餐当前快照 | `id`、`regionSlug`、`plan`、`price`、`currency`、`usd`、`cny`、`taxNote`、`channelNote`、`source`、`verifiedAt`、`confidence` |
| `price-history.json` | 每个套餐的变动记录 | `priceId`、`date`、`price`、`cny`、`changeType`、`source`、`note` |
| `tools.json` | 工具中立对比资料 | `slug`、`name`、`free`、`monthlyPrice`、`strength`、`audience`、`url` |
| `news.json` | 审核后的新闻摘要 | `slug`、`title`、`source`、`sourceUrl`、`publishedAt`、`market`、`companies`、`category`、`summary`、`importance` |
| `sources.json` | 新闻/价格来源清单 | `name`、`type`、`url`、`notes` |
| `saving-stack.json` | 合规省钱雷达的工具价格、年付与支付权益 | `tools`、`paymentMethods`、`watchlist`、`sourceUrl`、`annualFee`、`cashbackRate` |

### 手动新增地区

1. 在 `data/prices.json` 增加唯一 `id`，并填写稳定的英文 `regionSlug`；同一地区多个套餐共用 slug。
2. 标明 `confidence`：只能是 `官方公开价`、`含税估算`、`用户实测参考`；没有官方地区页时不得标“官方公开价”。
3. 填好税费、网页/App Store/Google Play 差异和可公开访问的来源 URL。
4. 如有变化，在 `price-history.json` 追加记录，并准确选择 `官方定价`、`汇率`、`税费`、`数据修正`。
5. 运行 `pnpm build`。地区详情页会自动静态生成。

### 手动新增工具和新闻源

- 工具：向 `tools.json` 追加资料，价格使用“起”或“因地区而异”等保守表述，不夸大功能。
- 新闻：向 `news.json` 追加不超过 120 字的中文摘要。全球 AI 新闻使用模型发布、产品更新、价格调整、融资、政策、应用案例、开源项目等分类；大陆新闻可使用时政、财经、社会等来源分类。必须填写 `market`（`global` 或 `mainland`）、`sourceUrl` 与真实 `publishedAt`。
- RSS：编辑 `scripts/update-news.ts` 的 `feeds`。仅添加官方或明确允许聚合的公开 RSS；抓取器仅读取标题、日期、摘要、链接，并按链接去重。

### 维护「省钱雷达」

- 在 `data/saving-stack.json` 中维护工具的公开月费、年付价格、官方来源与核验说明。没有官方年付价格时填写 `null`，不要推测折扣。
- 支付卡或返现权益必须同时具备可公开访问的官方权益页、活动条款、费用和地区资格信息；计算器必须把年费、返现上限和不适用的商户排除项算进去。
- 用户的账单选择仅通过浏览器 `localStorage` 保存，不会发送到 API 服务器，也没有登录、数据库或用户档案。
- 不收录跨区、代充、礼品卡套利、虚假地址、规避税费或违反平台规则的做法；无法完整核验的产品放入 `watchlist`，不要推荐或给出节省承诺。

### 自动更新

```bash
pnpm update:rates  # Frankfurter/ECB 公开参考汇率；成功后更新 USD/CNY 折算
pnpm update:news   # 公开 RSS；无发布日期的条目会跳过，失败时保留当前 news.json
```

`.github/workflows/update-data.yml` 每天 UTC 01:20 运行这两个命令并在有变更时提交。注意：自动抓取的摘要是规则截断；如需更自然的中文摘要，请在提交前人工审核，或在你自己的服务器中接入有授权的 AI API，绝不把密钥提交到仓库。

## GitHub Pages 部署

1. 新建 GitHub 仓库并推送本项目到 `main` 分支。
2. 在仓库 **Settings → Pages**，将 Source 设为 **GitHub Actions**。
3. 如为项目页，在 **Settings → Secrets and variables → Actions → Variables** 设置：
   - `SITE_URL`：`https://<用户名>.github.io/<仓库名>`
   - `BASE_PATH`：`/<仓库名>`
4. 如使用自定义域名，将 `SITE_URL` 设为 `https://你的域名`，`BASE_PATH` 设为 `/`，在 Pages 设置中填写域名并按 GitHub 提示配置 DNS。随后在 `public/` 新建内容为该域名的 `CNAME` 文件（例如 `example.com`）。
5. 推送后工作流会构建并发布。可以手动执行 **Actions → Build and deploy AI Price Map**。

> `BASE_PATH` 很重要：项目页必须带仓库名；自定义域名必须是 `/`，否则静态资源和链接会失效。

## 可选：个人服务器 API 代理

静态站本身可独立使用，代理挂掉也不会令首页报错。代理仅提供：`GET /health`、`GET /v1/rates?base=USD`。它只代理公开汇率并做内存缓存、限流；不保存新闻或价格 JSON、不抓取登录内容、不保存用户信息、不暴露密钥。

本项目按现有服务器约定使用腾讯云 Ubuntu 22.04、Docker Compose 和 `nginx-proxy`/`acme-companion` 外部网络 `web`。部署前将 `server/docker-compose.yml` 中的域名、邮箱和 `ALLOWED_ORIGIN` 改为真实值。

```bash
# 在服务器上（先把本仓库上传/克隆到这里）
cd ~/projects
git clone <你的仓库地址> ai-price-map
cd ai-price-map/server
cp .env.example .env
# 用 VS Code 修改 .env：填写 GitHub Pages/自定义域名、API 子域名和证书邮箱
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=100
curl -i https://ai-price-map-api.gjsx.uno/health
```

DNS 需要先增加 A 记录：主机记录 `ai-price-map-api`，记录值为服务器公网 IP `43.128.149.75`。HTTPS 证书签发前请确认 DNS 已生效。停止服务：`docker compose down`。

如果你的 API 子域名不是 `ai-price-map-api.gjsx.uno`，同时修改 `VIRTUAL_HOST`、`LETSENCRYPT_HOST` 和前端 `.env` 中的 `PUBLIC_API_BASE`。当前 MVP 静态页面不强依赖这个变量，后续可以用它做无刷新数据更新和匿名访问统计事件入口。

## 质量与可扩展性

- 静态内容在构建时生成，空新闻/接口失败不会破坏页面。
- 移动端导航可横向滑动，价格表可横向滚动，价格地图可切换卡片视图。
- `/robots.txt` 与 `/sitemap-index.xml` 已提供；在使用自定义域名后，请把 `public/robots.txt` 的 `Sitemap` 地址改成真实域名。每个新闻和地区都有独立静态 URL、title/description/OG 标签。
- 后续建议：价格数据审核工作流、更多官方 RSS、合规翻译/摘要队列、Cloudflare Web Analytics 或 Plausible、浏览器本地收藏、邮件提醒（需明确用户同意）。

## 上线前检查

```bash
pnpm check && pnpm build
```

还应手动检查：手机 320px 宽度、无 `news.json` 或新闻抓取失败、汇率上游 503、不同 `BASE_PATH`、每个价格来源链接、免责声明与自定义域名 HTTPS。
