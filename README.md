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
  "buildCommand": "npm run build:only",
  "outputDirectory": "dist"
}
```

构建走 `build:only`，也就是**不联网抓数据**，直接读仓库里的 `public/data/updates.json`。这样 Vercel 不需要任何 token，也不会因为 GitHub 限速导致部署失败。数据更新交给 GitHub Actions 提交快照，commit 推上去 Vercel 会自动重新部署，链路就闭合了。

导入步骤：

1. 打开 https://vercel.com/new ，用 GitHub 账号登录
2. 选中 `QookiX/QookiW-WhatsNew` 仓库，点 Import
3. Framework 会自动识别成 Vite，Root Directory 保持 `./`，其余留空（`vercel.json` 已经写好了）
4. 点 Deploy，等 1 分钟左右拿到 `*.vercel.app` 域名
5. 想绑自定义域名就在 Project → Settings → Domains 里加

之后每次 `git push` 到 `main` 都是自动部署，PR 也会生成预览环境。

## 自动更新

`.github/workflows/sync.yml` 每天定时跑一次 `sync:full` 并提交快照；也可以在 Actions 页面手动触发。手动触发时如果仓库有新提交，页面第二天就会跟上。

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
