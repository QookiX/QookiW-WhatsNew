# QookiX · 出炉日志

把 `QookiX` 组织下所有公开仓库的更新摊在同一张页面上：两个 Launcher 读 `CHANGELOG.md`，其余仓库回退到提交记录。

纯静态站点，数据在构建期抓成一份快照，运行时不发任何请求。

## 快速开始

```bash
npm install
npm run dev      # 会先同步数据，再起 dev server
```

## 数据同步

`scripts/sync-data.mjs` 负责抓取，产物是 `public/data/updates.json`（入库，clone 下来就有数据）。

```bash
npm run sync        # 增量（5 分钟内重复执行会跳过）
npm run sync:full   # 忽略缓存，全量重抓
```

抓取顺序：

1. `GET /orgs/QookiX/repos` —— 仓库列表
2. 逐个仓库尝试 `CHANGELOG.md` / `docs/CHANGELOG.md`（走 `raw.githubusercontent.com`，不消耗 API 额度）
3. 没有 changelog 的仓库回退到最近 30 条提交
4. 某个仓库抓取失败（限速/网络）时，沿用上一次快照里该仓库的数据，不会整块消失

匿名调用 GitHub API 只有 60 次/小时，本地频繁同步请带上 token：

```bash
# PowerShell
$env:GITHUB_TOKEN = "ghp_xxx"; npm run sync:full
# bash
GITHUB_TOKEN=ghp_xxx npm run sync:full
```

## 构建与部署

```bash
npm run build       # 先同步数据，再类型检查 + 构建 -> dist/
npm run build:only  # 跳过同步，直接用现有快照构建
npm run preview
```

`dist/` 是纯静态目录，`vite.config.ts` 里 `base: './'`，放根路径或子路径都能用。

### Vercel

仓库根目录已经有 `vercel.json`：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

构建时会跑一次 `sync`：配了 `GITHUB_TOKEN` 就抓最新数据，没配或者被限速就沿用仓库里的快照继续构建（不会失败）。

导入步骤：

1. 打开 https://vercel.com/new ，用 GitHub 账号登录，授权访问 `QookiX` 组织
2. 选中 `QookiX/QookiW-WhatsNew`，点 Import
3. Framework 自动识别为 Vite，Root Directory 保持 `./`，构建命令读 `vercel.json`，不用改
4. **建议**在 Environment Variables 里加一条 `GITHUB_TOKEN`（GitHub 个人访问令牌，`public_repo` 权限即可），否则每次构建只能用匿名额度，容易触发限速并回落到快照
5. 点 Deploy，约 1 分钟拿到 `*.vercel.app` 域名

之后每次 `git push` 到 `main` 都会自动部署，PR 也会生成预览环境。

### 定时刷新

Vercel 上的构建不会自己跑，需要一个定时器去踢它。用 Deploy Hook 最省事（不需要仓库写权限）：

1. Vercel 项目 → **Settings → Git → Deploy Hooks** → 创建一个，分支填 `main`，复制生成的 URL
2. GitHub 仓库 → **Settings → Secrets and variables → Actions → New repository secret**，名字 `VERCEL_DEPLOY_HOOK`，值粘贴上一步的 URL

`.github/workflows/sync.yml` **每 10 分钟**跑一次：

1. 用 `secrets.GITHUB_TOKEN` 跑一次 `sync:full`，抓最新数据
2. 用 `scripts/has-changed.mjs` 和仓库里的快照比对（只比 `repos` / `updates`，忽略 `generatedAt`）
3. **只有数据真的变了才请求 Deploy Hook**，避免每 10 分钟就产生一次部署

所以一天通常只部署 0～3 次，远低于 Vercel Hobby 每天 100 次的上限。

没配 secret 的话 workflow 会在日志里打一条黄色警告然后正常退出，不会报红。

三个限制要提前知道：

- **GitHub 的 schedule 不是精确时钟**。实测这个仓库每 6～8 小时才真正触发一次，高峰期可能再延迟。定时任务本身会在仓库连续 60 天没有 commit 时被 GitHub 自动停掉。
- 想更准一点的刷新频率，可以到 https://cron-job.org 之类的免费服务建一个定时任务，调 GitHub 的 `repository_dispatch` 接口（仓库 → Settings → Actions → General → Workflow permissions 里的 token 即可），绕开 GitHub 自己的排队。
- **Deploy Hook 是单向开关**：它只负责“叫醒 Vercel 重新构建”，Vercel 构建时自己会再跑一次 `sync`（用 Vercel 环境变量里的 `GITHUB_TOKEN`），所以数据永远是构建那一刻的。

## 数据更新

本地跑 `npm run sync:full` 之后提交 `public/data/updates.json` 就会更新线上的快照。线上每日自动刷新见上面「每日自动刷新」一节。

## 主视觉

Hero 右侧是组织头像，不是手绘图形：`public/brand/qookix-avatar.png`（460×460，白底已抠成透明）。换头像时重新导出一份同尺寸 PNG 覆盖即可，`image-rendering: pixelated` 会保留像素感。

头像外层是三层同心环（刻度盘、雷达扫掠、高速弧光）+ 十字轴 + 四角瞄准框，下方是实时读数组（repos / rel / cmt / star），右上角标签显示最新出炉的仓库。

重新抠图（把白底变透明）用 `chrome` 或任意图像工具都行，只要保留原图边缘的深色描边。

## 动效层

`src/components/FxLayer.tsx` 是全局特效挂载点，`src/styles/fx.css` 是它的样式：

- 细碎金屑粒子（canvas，鼠标靠近会被推开）
- 自定义光标：慢跟随光斑 + 快跟随圆点 + 悬停热区时放大的圆环
- 点击涟漪、全屏扫描光束、扫描线、暗角、页面竖栅格、左右边缘滚动数据流
- Hero 的透视地面网格、电压刻度、四角 HUD
- 标题逐字入场（`SplitText`），悬停时奇偶字符错位
- 卡片 3D 倾斜（`tilt`）、扫光、顶部亮边，更新卡片按批次入场
- `useReveal` 驱动的滚动进入揭示（`.reveal` + `data-reveal-delay`）

这些全部受 `prefers-reduced-motion` 与 `(hover: none)` 控制：关掉动效偏好时特效层不挂载，触屏设备不启用自定义光标。

## 视觉系统

- 主色是饼干暖金 `--biscuit`，只用在标题描边、关键数字、能量核心上
- 数据类信息统一用冷色 `--signal`（青），和暖色形成冷暖对照
- 卡片、分割线是中性灰白（`rgba(255,255,255,.05)` 级别），不再用金色铺底
- 巨型章节编号 `01/02/03`、数据带、页脚字标都在 `SectionHead` / `DataBand` / `Footer` 里

## 目录

```
scripts/sync-data.mjs     抓取 + 解析（CHANGELOG 解析器、conventional commit 解析）
public/data/updates.json  数据快照
src/components/FxLayer.tsx  光标 / 粒子 / 扫描层
src/components/SplitText.tsx 逐字入场标题
src/hooks/useReveal.ts     滚动揭示
src/styles/               设计令牌、布局、组件样式、fx 特效
```

## 数据来源说明

- 版本条目：`## [版本号] - 日期` 小节，逐条解析 `**模块**：说明`
- 提交条目：conventional commit（`feat(scope): …`）会拆出模块名
- 条目类型（新增 / 修复 / 调整 / 移除）由关键词判定，只影响图标，不影响内容
