# Agentpath

**造一个 agent** 的在线交互式学习项目。

agent 说到底就是一个 while 循环：让模型决定下一步调什么工具，直到它认为完事了。
难的从来不是这个循环，而是循环外面那一圈 —— 上下文怎么省、工具怎么设计、
权限在哪道门上拦、失控了谁来兜。这门课把那一圈补齐。

底座选 [Pi](https://pi.dev/)（Earendil 开源的 agent harness，MIT）。理由很简单：
它的内核刻意做得极小，sub-agent、plan mode、权限确认、沙箱、MCP 全都是**扩展**而不是内置黑盒 ——
能拆开的东西才讲得清，拆完还能照着造一个自己的。

线上地址：<https://agentpath.wutz.dev>

## 课程阶段

| 阶段 | 主题 | 说明 |
| --- | --- | --- |
| **L0** | 起点与底座 | agent 的定义、把 Pi 四种形态跑一遍、token 与 tool calling |
| **L1** | 内核解剖 | 八十行写最小 loop、Pi 的 loop、工具设计、提示词、上下文预算、会话、流式 |
| **L2** | 改造 Pi | extension 体系、写扩展、skill、权限门与路径保护、sub-agent、打包分发、闯关 |
| **L3** | 工程化 | SDK 嵌入、RPC 集成、沙箱、MCP 取舍、评测、可观测、成本与延迟 |
| **L4** | 真实战场 | 编码 agent、运维 agent、多 agent、长期记忆、失控闯关、造自己的 harness |

共 5 个阶段 **31 节课，全部已完成正文**，约 18 小时。其中动手环节 13 节
（8 个实验 + 2 个故障闯关 + 3 个推演/计算器）。

课程大纲是全站唯一数据源，定义在 `src/lib/curriculum.ts`；`status: 'ready'` 表示已有正文，
`'planned'` 的课打开会渲染定稿大纲占位（当前没有这类课）。

内容口径以 <https://pi.dev/docs/latest> 的对应文档页为准，每节课的「延伸资料」直接指向
它依据的那一页（extensions / skills / sdk / rpc / compaction / containerization / security …）。

## 交互形式

- **检查点（Quiz）** —— 随堂单选/多选，选错给针对性反馈，答对写入本地进度
- **循环推演（LoopFlow）** —— 逐步走完 agent 的一轮循环，还能把某个环节「打挂」，
  看这一轮断在哪、现象是什么，并对上「现象 → 该查哪一段」
- **上下文预算推算（ContextBudget）** —— 从窗口、提示词、工具数、工具输出算出
  **不压缩的话第几轮撞墙**、窗口被谁吃掉、压缩多少次、缓存省了多少钱
- **命令行闯关（Terminal）** —— 模拟终端，预置真实输出，按目标一步步定位根因
- **进度追踪** —— 存 localStorage，无账号体系，换设备不同步

## 技术栈

与 [kubepath](https://kubepath.wutz.dev/) / [storpath](https://storpath.wutz.dev/) /
[netpath](https://netpath.wutz.dev/) 保持一致：

- **TanStack Start / Router** —— 全栈 React 框架 + 类型安全文件路由
- **MDX** —— 课程正文，可直接内嵌交互组件
- **Shiki** —— 构建期代码高亮
- **Tailwind CSS 4** —— 样式
- **Cloudflare Workers** —— 部署

视觉体系同源 `DESIGN.md`（Vercel 语言）：中性色、语义色、圆角、阴影、字体全部对齐，
只有品牌色相各站不同 —— storpath 暖锑红、netpath 青、kubepath K8s 蓝，
agentpath 取绿（agent 是「跑起来才算存在」的东西）。

## 快速开始

```bash
bun install
bun run dev        # http://localhost:3004
bun run build
bun run typecheck
bun run deploy     # 手工部署到 Cloudflare Workers
```

### 关于 `@tanstack/*` 的精确版本

三个 `@tanstack/*` 包在 `package.json` 里写的是**精确版本**而不是 `^` 范围，
和 kubepath 同样的理由：TanStack 的包之间用精确版本互锁，而它一天要发好几个版本，
国内镜像同步有先后，范围版本很容易装出互不兼容的组合。升级时三个一起动，装完跑一次
`bun run build` 再提交。

## 加一节课

1. 在 `src/lib/curriculum.ts` 里找到对应阶段，写上 `id / title / summary / kind /
   minutes / objectives / outline`，`status` 先留 `'planned'`。
2. 正文写到 `src/content/<trackId>/<lessonId>.mdx`，交互组件直接用（`Callout`、`Quiz`、
   `Terminal`、`LoopFlow`、`ContextBudget`，无需 import）。
3. 把 `status` 改成 `'ready'`。

## 内容口径

- Pi 的行为以 <https://pi.dev/> 与其仓库为准，写到具体扩展点时标出源码路径
- 模型能力、价格、窗口大小会变，正文里尽量给口径和算法，而不是写死数字
- 结论优先给「怎么判断」，其次才是「怎么做」
