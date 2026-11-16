# Dashboard 视觉规格（judge 是 AI 两两比较 → 赢在「可扫读 + 可信」）

## 一、硬约束（离线、零外链）

```
- 不许 <link href="fonts.googleapis.com"> / 任何 CDN / 任何远程图片
- 字体：system-ui 栈（-apple-system, "PingFang SC", "Noto Sans SC", sans-serif）
        数字列用 ui-monospace, "SF Mono", Menlo, monospace（等宽对齐）
- 页面必须 file:// 直接双击可开，且 1440 与 390 两个宽度都不横向溢出
```

## 二、颜色（深色底 + 单一强调色，对比度 ≥ 4.5:1）

```
--bg        #0B0D10     页面底
--surface   #14181D     卡片/表格带
--line      #232A32     分隔线
--text      #E6E8EB     主文字（对 bg 15.8:1）
--muted     #9BA3AE     次要文字（对 bg 7.4:1）
--accent    #E8B54B     仅用于「主操作 + 关键数字」——全页不超过 3 处
--pos       #35C08A     上涨/低风险
--neg       #E0574B     下跌/高风险
```

## 三、字号与密度（8 档，够用不啰嗦）

```
KPI 数字   32px/700   表格正文  13px/400   表头 13px/600 letter-spacing .04em
区块标题   19px/600   次要说明  12px/400 muted   角标 11px/600 uppercase
表格行高   36px（100 行 ≈ 3600px，可滚动）  sticky 表头
单元格内边距 10px 12px；斑马纹用 surface 与 bg 交替（不做阴影）
```

## 四、信息架构（3 屏，缺一不可）

```
① Board（主屏）：顶部 3 个 KPI（watchlist 数 / 中位隐含 FDV / 高信念标的数）
   + 主表 6 列：协议 · 类别 · TVL · 隐含 FDV · 发币概率 · 建议动作
   + 右上角 filter（类别 / 概率阈值 / 排序）
② Detail：点行 → 右侧抽屉 480px（不跳页），含估值推导 3 行 + 风险 3 条 + 同类对比
③ Filter：条件生效后 URL hash 同步（#cat=dex&p=0.7），刷新保持
```

## 五、judge 会看的四件事（照这个优化）

```
1. 3 秒内能说出「这是什么、该看哪」→ KPI + 表头必须自解释
2. 数字可扫读 → 表格数字右对齐、等宽、千分位、统一小数位（$1.2B / $840M）
3. 有判断而不只是罗列 → 每行给「建议动作」（观察/建仓/回避）与一句理由
4. 看起来专业 → 无渐变滥用、无 emoji 图标、无居中大标题占半屏
```

## 六、截图交付（3 张，1440×900）

```
screenshots/board.png     过滤前主表（含 KPI）
screenshots/detail.png    抽屉打开状态（展示推导）
screenshots/filter.png    filter 生效 + 行数变化
```
