# Lead 复核发现（2026-11-16 17:35）—— 3 个真缺陷，修完再提交

> 我独立渲染了 `dashboard/index.html`（1440×900），并用 `board.json` 原始数据复算了 KPI。
> 不是看它的截图，是自己跑了一遍。

## P1（数据说服力，judge 第一眼就看这个）

**KPI「MEDIAN IMPLIED FDV $6K」是错的观感来源。**

实测：全量 2048 行的 impliedFDV 中位数就是 **$6,310**，但这是因为 **86%（1777 行）的协议 TVL < $1M**——
DeFiLlama 的长尾空壳协议把中位数拉到几千美元。只有 **108 行 TVL ≥ $10M**，这批的中位 impliedFDV 是 **$24,105,784**。

**问题不是算错，是「没有口径」**：judge 看到 $6K 会认为数据不可信。

**改法（照做）**：
```
① KPI 换成「有意义的样本」：只统计 TVL ≥ $10M 的协议（108 行）
   KPI 标题写清口径：MEDIAN IMPLIED FDV（TVL≥$10M, n=108）
② 主表默认排序保持「隐含 FDV↓」，但顶部加一行说明：
   「2048 个 pre-token 协议；TVL≥$10M 的 108 个为可行动样本」
③ 增设 filter 快捷按钮：「只看可行动样本（TVL≥$10M）」
```

## P2（KPI 与数据不一致）

页面 **HIGH CONVICTION = 72**，但 `board.json` 里 `probability ≥ 0.7` 的行只有 **20** 个。

```
要么 KPI 用的阈值不是 0.7（那就把阈值写进标题：HIGH CONVICTION (p≥0.6)）
要么就是算错 → 按 board.json 复算，并对齐到与 filter 相同的口径
```

## P3（横向溢出）

`shot.mjs` 报 3 处越界，最大的是关闭状态的抽屉：

```
<div class="drawer"> right=1920   ← 溢出 480px
<button class="drawer-close"> right=1904
```

**改法**：
```css
body { overflow-x: hidden; }
.drawer { transform: translateX(100%); transition: transform .24s ease; }  /* 关时移出视口 */
.drawer.open { transform: translateX(0); }
```

## 复核通过的部分（别改）

```
✅ 离线零外链（dashboard 里 0 个 http 引用，字体栈符合 VISUAL-SPEC）
✅ board.json 2048 行，字段齐（protocol/category/tvl/impliedFDV/probability/action/actionReason/chains）
✅ 3 张截图都在，1440×900
✅ git 三次提交语义清晰（T2 核心逻辑 / T3 静态页 / T3 文档）
✅ taskcheck 与 bundle --dry-run 都过了
```

## 修完的验收（三条命令，贴输出）

```bash
node ~/.local/bin/shot.mjs dashboard/index.html -o /tmp/v.png --w 1440 --h 900   # 越界应为 0
node ~/.local/bin/taskcheck.mjs .                                               # exit 0
bundle --dry-run                                                                # 1 session
```
