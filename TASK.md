# 赏金任务：token-radar-01

> 本目录**只做一个赏金**。会话也只做这一个——因为提交时要把**本会话日志**当 transcripts 打包公开。


## 0. 准入自检（必填，答"否"就换题）

```
- [x] 本赏金不需要拉真人注册 / 不需要我推广（题面无 referral / signup 要求）
- [x] 本赏金不需要钱包签名转账 / 不需要我发币（只要 Node + 浏览器 + 静态页）
- [x] 本赏金不需要垫入场费、不需要第三方充值（prerequisites 只有 Node 22.18+ 与浏览器）
→ 三项都是"是"才继续；任一"否"就停下换题，并在下面写原因：
   原因：无需填（三项皆通过）
   依据：1.2 Prerequisites 只列 Node 22.18+ / 浏览器，与 AGENTS.md 第 5 条黑名单对照无命中
```

## 1. 题面（从 API 抄来，不要凭记忆写）

```
GET https://make.fun/api/competitions/token-radar-01/requirements
```

### 1.1 核心任务

Build the best **token launch radar**。读取 DefiLlama 追踪的所有协议的去密封快照，找出哪些协议**还没有代币**且**不是已交易代币的包装/质押产品**，然后按「如果发币会值多少钱」来排名，交付一个 Web Dashboard，展示：
- 总览 board（≥100 行，全部 watchlist，每行含隐含价值和 farming 计划）
- 每个协议的 detail view
- 一个 filter view

AI judge 两两比较 dashboard 后排名。前 10 名分 $1,325。

### 1.2 Prerequisites

- **Node.js 22.18+**（本机 v24 ✅）
- **浏览器**（Chrome ✅）
- 无钱包/无垫钱/无第三方注册要求

### 1.3 Deliverables（requirements 页面正式表格）

| 项目 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `repo_url` | form_field | ✅ | 公开 GitHub 仓库（https://github.com/owner/repo） |
| `commit_sha` | form_field | ✅ | 40 字符 commit sha |
| `bundle` | file | ✅ | 会话 transcript bundle（.tar.gz） |
| `title` | form_field | ❌ | ≤200 字符 |
| `entry_message` | form_field | ✅ | make.fun entry v1 消息 |
| `entry_signature` | form_field | ✅ | Ed25519 签名（base58） |
| `LICENSE` | repo_file | ✅ | OSI 许可（MIT/Apache-2.0） |
| `main.ts` | repo_file | ✅ | 入口文件（node22 运行） |
| `.makefun/owner.json` | repo_file | ❌ | 钱包-only 账户需要 `{"wallet": "..."}` |

### 1.4 评分方式

- **AI judge 两两比较**（pairwise comparison）：judge 比较两个 dashboard，选更好的
- 排名基于 judge 选择频率
- 前 10 名分奖金

### 1.5 截止与奖金

- **截止**：2026-12-14T10:00:00.000Z
- **总奖金**：$1,325（第 1 名 $1000，第 2-10 名各 $50，第 6-10 名各 $25）
- **当前参赛数**：8498+（截至 API 返回时）
- **每日提交上限**：5 次，总计 10 次
- **入场费**：$0（免费）

### 1.6 关键硬约束（Checks）

- `account_wallet`：需 Solana 钱包 ✅（keypair 已配好）
- `repo_public` / `repo_owner` / `license_osi`：公开仓库 + MIT 许可
- `run_completes`：grader 沙箱内 120s / 1CPU / 1024MB / 64 进程内 exit 0
- `run_deterministic`：两次运行结果一致
- `transcripts_present` / `transcripts_recorded` / `thinking_reproduces` 等：会话日志需完整
- `thinking_turns`：≥5 assistant turns 含 text/thinking
- `thinking_revised`：≥2 assistant messages 写/编辑文件
- `thinking_in_window`：所有时间戳在 competition 开赛后

## 2. 我们凭什么能做（本机能力）

```
Node v24.21.0 · Chrome · Playwright chromium · WebGL2 ✅
```

## 3. 验收（自己定的，必须可执行）

```
- [ ] node main.ts → exit 0，输出 board.json + dossier.json
- [ ] board.json 行数 ≥100，每行含 implied value + farm plan
- [ ] dashboard/index.html 在浏览器 file:// 打开，无网络请求
- [ ] 3 张截图存在（screenshots/board.png, detail.png, filter.png）
- [ ] LICENSE 含 SPDX-License-Identifier: MIT
- [ ] .makefun/owner.json 含 {"wallet": "..."}
- [ ] git log 有 ≥5 assistant turns 含 text/thinking
- [ ] ≥2 assistant messages 写/编辑 main.ts
```

> 视觉与信息架构规格见 `VISUAL-SPEC.md`（judge 是 AI 两两比较，赢在可扫读与可信度）

## 4. 计划（T1..T3，每条带验证）

```
T1: 搭建项目骨架
    - 初始化 git 仓库，MIT LICENSE
    - 创建 main.ts 骨架（空实现，确保 exit 0）
    - 创建 .makefun/owner.json（{"wallet": "..." }）
    - 首次 commit + push
    验证：node main.ts → exit 0；git log 有 commit；LICENSE 存在

T2: 实现核心逻辑：fetch DefiLlama → 过滤无代币协议 → 计算 implied value → 生成 board.json
    - 从 DefiLlama API 拉取协议快照
    - 过滤：无 token + 非 wrapped/staked 产品
    - 设计估值模型（comparables-based implied value）
    - 生成 board.json（≥100 行，每行含 implied value + farm plan）
    - 生成 dossier.json
    验证：node main.ts 输出 board.json + dossier.json；行数 ≥100；两次运行结果一致

T3: 构建 dashboard 静态页面 + 截图 + 最终提交
    - 构建 dashboard/ 下的静态 HTML/CSS/JS（无网络请求，零外链）
    - 实现 board view、protocol detail view、filter view
    - 用 Playwright/浏览器截 3 张图 → screenshots/
    - 最终自测：node main.ts 沙箱模拟运行
    - bundle --dry-run → 用户确认 → 提交
    验证：dashboard/index.html 在浏览器离线打开；3 张截图存在；node main.ts exit 0
```

## 5. 提交前检查（缺一不可）

```
- [ ] 本会话只做了这个赏金（没有别的赏金的讨论）
- [ ] grep -ri "af_\|credentials\|keypair" . → 空
- [ ] bundle --dry-run 的会话清单 == 只有本会话
- [ ] 用户已看过 dry-run 清单并确认
```

## 6. 状态

```
开始时间：2026-11-16 15:48 CST
当前阶段：T1 ✅ + T2 ✅ + T3 ✅ + FIXES-by-lead ✅ → 等待提交
```
