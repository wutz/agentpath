/**
 * 课程大纲 —— 全站唯一数据源。
 * 阶段页、课程页、动手索引、进度统计都从这里派生。
 *
 * status: 'ready'   已有正文（src/content/<trackId>/<lessonId>.mdx）
 *         'planned' 仅有大纲，课程页会渲染大纲占位
 */

export type LessonKind = 'concept' | 'lab' | 'quest' | 'sim'
export type LessonStatus = 'ready' | 'planned'

export interface LessonRef {
  label: string
  /** 外部链接；仓库内路径留空 href，按代码样式展示 */
  href?: string
  path?: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  kind: LessonKind
  status: LessonStatus
  /** 预计学习时长（分钟） */
  minutes: number
  /** 学完能做什么 */
  objectives: string[]
  /** 小节大纲 */
  outline: string[]
  refs?: LessonRef[]
}

export interface Track {
  id: string
  level: string
  title: string
  subtitle: string
  goal: string
  lessons: Lesson[]
}

export const KIND_LABEL: Record<LessonKind, string> = {
  concept: '原理',
  lab: '动手',
  quest: '闯关',
  sim: '推演',
}

/*
 * 课程类型徽标，与 kubepath / storpath 同一套映射：
 * 「原理」是默认形态走中性，三种动手环节各占一个语义色。
 * 阶段（L0–L4）不参与配色 —— 它的徽标一律中性，颜色这一维只留给类型与状态。
 */
export const KIND_STYLE: Record<LessonKind, string> = {
  concept: 'bg-soft-2 text-body',
  lab: 'bg-brand-50 text-brand-700',
  quest: 'bg-warn-soft text-warn-deep',
  sim: 'bg-plum-soft text-plum-deep',
}

/** 阶段徽标（L0–L4）：全站统一的中性小标签 */
export const LEVEL_CHIP =
  'rounded-xs bg-soft-2 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-body'

/* ---------- 常用延伸资料 ---------- */

/** Pi 仓库里的具体文件，课程页按代码样式展示路径 */
const pi = (path: string): LessonRef => ({ label: 'pi 源码', path })
const REF_PI: LessonRef = { label: 'Pi 官网与文档', href: 'https://pi.dev/' }
const REF_PI_DOCS: LessonRef = { label: 'Pi Documentation', href: 'https://pi.dev/docs/latest' }
const REF_PI_REPO: LessonRef = {
  label: 'badlogic/pi-mono（GitHub）',
  href: 'https://github.com/badlogic/pi-mono',
}
const REF_ANTHROPIC_TOOLS: LessonRef = {
  label: 'Anthropic — Tool use',
  href: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview',
}
const REF_EFFECTIVE_AGENTS: LessonRef = {
  label: 'Anthropic — Building effective agents',
  href: 'https://www.anthropic.com/engineering/building-effective-agents',
}
const REF_NO_MCP: LessonRef = {
  label: 'Mario Zechner — 为什么 Pi 不做 MCP',
  href: 'https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/',
}

export const tracks: Track[] = [
  /* ══════════════════ L0 ══════════════════ */
  {
    id: 'l0-start',
    level: 'L0',
    title: '起点与底座',
    subtitle: 'agent 是什么、Pi 长什么样',
    goal:
      'agent 这个词被用得太散了。这一阶段先划清它和聊天机器人、和固定工作流的界线，把 Pi 装上手动一遍，再补齐 token、上下文窗口、tool calling 这三样绕不过去的底子。',
    lessons: [
      {
        id: 'what-is-an-agent',
        title: 'agent 到底是什么：一个 while 循环',
        summary:
          '去掉包装，agent 就是「让模型自己决定下一步调什么工具，直到它说完事了」。这个定义决定了后面所有设计取舍。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '用一句话说清 agent、chatbot、workflow 三者的界线，并判断手头需求属于哪一类',
          '指出 agent 的自主性来自哪里，以及代价是什么（不可预测、成本、越权）',
          '识别「其实不需要 agent」的场景，避免拿循环去做 if-else 的活',
        ],
        outline: [
          '从一次普通的 API 调用说起',
          '加上工具：模型开始能改变外部世界',
          '加上循环：谁来决定「还要不要继续」',
          'workflow 与 agent 的分界线：控制流在代码里还是在模型里',
          'harness 是什么：Pi、Claude Code、Codex 都在做同一件事',
          '什么时候不该用 agent',
        ],
        refs: [REF_EFFECTIVE_AGENTS, REF_PI],
      },
      {
        id: 'pi-quickstart',
        title: '把 Pi 装上：四种运行形态各跑一遍',
        summary:
          'Pi 有交互式 TUI、print/JSON、RPC、SDK 四种形态。四个都跑过一遍，你才知道自己以后要用哪个口子。',
        kind: 'lab',
        status: 'planned',
        minutes: 35,
        objectives: [
          '装好 Pi 并配好至少一个模型提供方（API key 或 OAuth）',
          '分别用交互模式、`pi -p`、`--mode json`、RPC 跑通同一个任务',
          '说出四种形态各自适合什么集成场景',
        ],
        outline: [
          '安装：install.sh 与 npm / bun 全局安装',
          '配模型：API key、OAuth、`/model` 与 `Ctrl+L`',
          '交互模式：一次完整的会话',
          'print 模式：`pi -p "..."` 塞进脚本里',
          'JSON 模式：把事件流打出来看',
          'RPC 模式：stdin/stdout 上的 JSON 协议',
          '四种形态的选择表',
        ],
        refs: [REF_PI, REF_PI_DOCS],
      },
      {
        id: 'llm-basics',
        title: '一次模型调用里发生了什么：token、采样、成本',
        summary:
          '不懂 token 就调不好 agent —— 上下文爆掉、账单失控、复读机般的输出，根子都在这一节。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '算出一次请求的输入/输出 token 与费用，并解释缓存命中怎么改变这个数',
          '解释 temperature、top-p、stop 对 agent 稳定性的影响',
          '说清上下文窗口是硬约束，以及超限时的三种处理方式',
        ],
        outline: [
          'messages 结构：system / user / assistant / tool',
          'token 化：为什么中文和代码的计费不一样',
          '上下文窗口：输入 + 输出共享同一个预算',
          'prompt caching：命中条件与失效条件',
          '采样参数对 agent 的影响',
          '流式返回与 TTFT / TPS',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'tool-calling',
        title: 'tool calling 协议：模型怎么「动手」',
        summary:
          '工具调用不是魔法，是一段结构化的 JSON 往返。看懂这段往返，你就能自己造工具，也能读懂 agent 卡在哪。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '手写一个工具的 JSON Schema，并说明每个字段会怎样影响模型的调用准确率',
          '画出 tool_use → 执行 → tool_result 的完整往返，包括并行调用与失败回传',
          '解释为什么工具的错误信息要写给模型看，而不只是打日志',
        ],
        outline: [
          '工具声明：name、description、input_schema',
          '一次往返：stop_reason=tool_use 之后该做什么',
          '并行工具调用与结果顺序',
          '失败怎么回：报错文本就是给模型的下一轮输入',
          '危险工具与确认边界（这里先埋个伏笔，L2 细讲）',
          '为什么 description 比 schema 更重要',
        ],
        refs: [REF_ANTHROPIC_TOOLS, REF_PI_DOCS],
      },
    ],
  },

  /* ══════════════════ L1 ══════════════════ */
  {
    id: 'l1-core',
    level: 'L1',
    title: '内核解剖',
    subtitle: 'loop、工具、上下文、会话',
    goal:
      '这一阶段自己写一个能跑的最小 agent，然后拿 Pi 的实现逐项对照：它的 loop 多了什么、上下文怎么管、会话为什么是树。写过一遍再读源码，收获完全不同。',
    lessons: [
      {
        id: 'the-loop',
        title: '八十行写出你自己的 agent loop',
        summary:
          '不借任何框架，用一个 while 和两个工具跑起来。这八十行是后面所有内容的地基。',
        kind: 'lab',
        status: 'ready',
        minutes: 45,
        objectives: [
          '从零写出一个能读写文件、能跑命令的最小 agent，并让它完成一个真实小任务',
          '说出循环的三个退出条件，以及每一个漏掉会出什么事',
          '给自己的 loop 加上轮次上限与 token 上限两道保险',
        ],
        outline: [
          '骨架：messages 数组 + while + 工具分发',
          '两个工具：read_file 与 bash',
          '退出条件：模型不再调工具 / 达到上限 / 用户中断',
          '把工具错误喂回去，看模型自己纠错',
          '加保险：max_turns、max_tokens、超时',
          '和 Pi 的 loop 比一比：多出来的部分都是什么',
        ],
        refs: [REF_ANTHROPIC_TOOLS, REF_PI_REPO],
      },
      {
        id: 'loop-anatomy',
        title: 'Pi 的 loop：事件流、中断与 steering',
        summary:
          '真实 harness 的循环比教学版复杂的地方，几乎都在「人要能插话」这件事上。',
        kind: 'sim',
        status: 'ready',
        minutes: 35,
        objectives: [
          '按步走完 Pi 的一轮循环，指出每一步的产物与失败表现',
          '解释 steering（Enter）与排队（Alt+Enter）在循环里的落点差异',
          '判断某个现象该去循环的哪一段找原因',
        ],
        outline: [
          '一轮的完整链路：输入 → 上下文组装 → 请求 → 工具 → 回灌',
          '事件流模型：为什么 UI 只订阅事件',
          'steering：打断当前工具之后剩下的工具怎么办',
          '排队消息：等这一轮跑完再进去',
          '取消与清理：半路停下时的状态一致性',
          '把某一段「打挂」：现象与定位顺序',
        ],
        refs: [REF_PI_DOCS, pi('src/core/')],
      },
      {
        id: 'tools-design',
        title: '工具设计：粒度、错误与幂等',
        summary:
          'agent 的能力上限由工具决定。工具设计糟糕时，换更强的模型也救不回来。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '按「一个工具一件事」的原则拆分或合并现有工具',
          '写出对模型友好的错误返回：说清哪里错了、下一步能做什么',
          '区分只读与写入工具，并为写入工具设计幂等与回滚',
        ],
        outline: [
          '粒度：过粗模型不会用，过细模型调不完',
          'description 写给谁看：那是提示词的一部分',
          '错误返回的三段式：现象 + 原因 + 可行动作',
          '只读 / 写入 / 危险，三档分类',
          '幂等与重试：模型会重复调同一个工具',
          '输出裁剪：别让一次 grep 吃掉半个上下文',
        ],
        refs: [REF_PI_DOCS, REF_NO_MCP],
      },
      {
        id: 'system-prompt',
        title: '系统提示词、AGENTS.md 与 SYSTEM.md',
        summary:
          '同一个模型、同一套工具，换一份系统提示词就是另一个 agent。Pi 把这层完全交给你改。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '读懂 Pi 的默认系统提示词分了哪几块、各自解决什么问题',
          '为自己的项目写出一份有效的 AGENTS.md，并说明它和 SYSTEM.md 的分工',
          '判断某条规则应该写进提示词、写进工具描述、还是做成 skill',
        ],
        outline: [
          '默认提示词的结构：身份、工具约定、行为边界、输出格式',
          'AGENTS.md：从 `~/.pi/agent/`、祖先目录到工作目录的层叠',
          'SYSTEM.md：覆盖还是追加',
          '提示词里的硬规则 vs 工具描述里的软约定',
          '规则失效的常见原因：位置、冲突、长度',
        ],
        refs: [pi('src/core/system-prompt.ts'), REF_PI_DOCS],
      },
      {
        id: 'context-window',
        title: '上下文预算与 compaction',
        summary:
          '上下文是最贵、最先撞墙的资源。这一节把账算清楚：谁在吃、第几轮撞墙、压缩要压什么。',
        kind: 'sim',
        status: 'ready',
        minutes: 40,
        objectives: [
          '算出一个 agent 会话的上下文构成，并指出最先撑爆窗口的那一项',
          '预测在给定窗口下大约第几轮触发 compaction',
          '设计一个不破坏 prompt 缓存的压缩策略',
        ],
        outline: [
          '上下文的五个吃客：系统提示、工具 schema、历史、工具输出、文件内容',
          '工具输出是最大的变量：一次 cat 就能吃掉几万 token',
          'compaction 触发点与摘要策略',
          '压缩与 prompt 缓存的冲突：压一次等于全量重算',
          '替代手段：截断、外置记忆、按需读取',
          '自定义 compaction：按主题、按代码结构、换小模型做摘要',
        ],
        refs: [pi('docs/'), REF_PI_DOCS],
      },
      {
        id: 'sessions',
        title: '会话状态：为什么 Pi 把历史存成一棵树',
        summary:
          '线性日志只能后悔，树可以回到任意一步重新走。这个选择直接改变了使用方式。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '解释树状会话与线性日志的差别，以及 fork 解决了什么实际问题',
          '用 `/tree` 回到指定节点重开一条分支',
          '设计自己应用里的会话持久化格式',
        ],
        outline: [
          '一次会话里到底要存什么',
          '树 vs 线性：fork、重放、对比',
          '`/tree`、书签与按类型过滤',
          '导出与分享：`/export`、`/share`',
          '存储格式与体积：一个文件装一棵树',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'streaming-ux',
        title: '流式输出与 TUI：agent 的体感',
        summary:
          '同样的模型，等三十秒黑屏和边跑边出字，用起来是两个东西。',
        kind: 'concept',
        status: 'planned',
        minutes: 25,
        objectives: [
          '把模型的流式事件映射成界面上的增量更新',
          '设计工具执行过程中的进度呈现与可中断入口',
          '说出终端 UI 的三个常见坑：重绘、宽字符、滚动',
        ],
        outline: [
          '事件类型：文本增量、工具开始/结束、用量',
          '把事件画成界面：pi-tui 的做法',
          '长工具的进度与可中断',
          '终端里的宽字符与重绘',
          '非终端宿主（Web / 桌面）怎么复用同一套事件',
        ],
        refs: [REF_PI_REPO],
      },
    ],
  },

  /* ══════════════════ L2 ══════════════════ */
  {
    id: 'l2-extend',
    level: 'L2',
    title: '改造 Pi',
    subtitle: 'extension、skill、权限与分发',
    goal:
      'Pi 的核心刻意做得很小 —— sub-agent、plan mode、权限门、沙箱全都是扩展。这一阶段把这套扩展体系吃透，你就能把任何 harness 掰成自己的形状。',
    lessons: [
      {
        id: 'extension-model',
        title: 'extension 能碰到什么',
        summary:
          '工具、命令、快捷键、事件、TUI —— 扩展点的边界，就是你能改造的边界。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '列出 Pi 的扩展点，并为一个需求选出该挂在哪个点上',
          '读懂一个官方示例扩展的完整结构',
          '说明扩展的加载顺序、隔离边界与 `/reload` 的作用',
        ],
        outline: [
          '扩展是一个 TypeScript 模块',
          '五类扩展点：tools / commands / keybindings / events / TUI',
          '加载来源与顺序',
          '热重载：让 agent 改自己的扩展代码，然后 `/reload`',
          '看看官方 50+ 示例都在改什么',
        ],
        refs: [REF_PI_DOCS, REF_PI_REPO],
      },
      {
        id: 'first-extension',
        title: '写第一个扩展：给 agent 加一件新武器',
        summary:
          '从一个真实需求出发（查内部系统、跑项目脚本），把它变成 agent 手里的工具。',
        kind: 'lab',
        status: 'planned',
        minutes: 45,
        objectives: [
          '写出一个带参数校验与错误处理的自定义工具并装进 Pi',
          '加一个斜杠命令和一个快捷键，把常用操作固化下来',
          '用事件钩子在每轮开始前注入动态上下文',
        ],
        outline: [
          '搭起扩展骨架',
          '注册工具：schema、执行、返回裁剪',
          '注册命令与快捷键',
          '订阅事件：pre-turn 注入',
          '调试手法：日志、`--mode json`、`/reload`',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'skills',
        title: 'skill：按需装载的能力包',
        summary:
          '把「指令 + 工具」打成一包，用得上才进上下文 —— 渐进披露的关键是别把缓存打碎。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '判断一件事该做成 skill 还是写进系统提示词',
          '写出一个 skill 的触发描述，让它在该出现的时候出现',
          '解释渐进披露怎么和 prompt 缓存共存',
        ],
        outline: [
          'skill = 指令 + 工具 + 触发条件',
          '触发描述怎么写才准',
          '渐进披露：索引在前，正文按需',
          '和 AGENTS.md 的分工',
          'skill 打包与复用',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'permission-gate',
        title: '权限门与路径保护：让它别删库',
        summary:
          'Pi 不内置权限弹窗 —— 这不是缺陷，是让你自己定义什么叫危险。',
        kind: 'lab',
        status: 'planned',
        minutes: 40,
        objectives: [
          '实现一个按工具与参数分级的确认门',
          '用路径白名单/黑名单挡住写操作越界',
          '为无人值守场景设计「不弹窗也安全」的策略',
        ],
        outline: [
          '危险的定义：不可逆、对外可见、影响他人',
          'permission-gate 示例扩展逐行读',
          'protected-paths：路径匹配的坑',
          '命令行审查：拦 `rm -rf` 是不够的',
          '无人值守：沙箱 + 白名单 + 事后审计',
        ],
        refs: [pi('examples/permission-gate.ts'), pi('examples/protected-paths.ts')],
      },
      {
        id: 'subagents',
        title: 'sub-agent 编排：为什么核心不内置',
        summary:
          '子 agent 是省上下文的利器，也是把问题藏起来的利器。自己造一遍才知道该不该用。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '说清 sub-agent 真正解决的是上下文隔离而不是并行加速',
          '实现一个把结果结构化返回给主 agent 的子 agent 工具',
          '判断哪些任务不该派出去',
        ],
        outline: [
          '为什么要隔离上下文',
          '子 agent 的接口：一句任务，一份结构化结果',
          '并发与成本：并行不等于更快',
          '失败传播与超时',
          '不该派出去的任务：需要全局上下文的、需要人确认的',
        ],
        refs: [pi('examples/subagent/'), REF_EFFECTIVE_AGENTS],
      },
      {
        id: 'packaging',
        title: '打包成 Pi package 并分发',
        summary:
          '扩展写完只在你机器上有用；打成包就能给团队用，也能被别人的 agent 装上。',
        kind: 'lab',
        status: 'planned',
        minutes: 30,
        objectives: [
          '把扩展、skill、提示词模板、主题打成一个可安装的包',
          '通过 npm 与 git 两条路径分发并验证安装',
          '为包写出让人一眼看懂装了会多什么的说明',
        ],
        outline: [
          '包结构与清单',
          '`pi install npm:` 与 `pi install git:`',
          '版本与兼容：核心变了怎么办',
          '团队内分发的现实做法',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'quest-tool-loop',
        title: '闯关：agent 卡在工具死循环里',
        summary:
          '同一个工具连调二十次，token 一路涨，任务毫无进展。在模拟终端里找出根因。',
        kind: 'quest',
        status: 'planned',
        minutes: 30,
        objectives: [
          '从事件流里定位重复调用的起点与触发条件',
          '区分三类根因：工具返回没信息、提示词冲突、退出条件缺失',
          '给出修复方案并说明为什么这次不会再犯',
        ],
        outline: [
          '接手现场：一份 `--mode json` 的事件流',
          '先看用量曲线，再看调用序列',
          '复现：把同一段上下文重放一次',
          '三类根因的分辨方法',
          '修复与回归验证',
        ],
        refs: [REF_PI_DOCS],
      },
    ],
  },

  /* ══════════════════ L3 ══════════════════ */
  {
    id: 'l3-production',
    level: 'L3',
    title: '工程化',
    subtitle: '嵌入、隔离、评测、成本',
    goal:
      '能跑通和敢上线之间差的就是这一阶段：把 agent 嵌进自己的应用，关进沙箱，给它写测试，把 token 账单和失败率变成看得见的曲线。',
    lessons: [
      {
        id: 'sdk-embed',
        title: '用 SDK 把 agent 嵌进自己的应用',
        summary:
          '不是所有 agent 都长成终端。SDK 模式让 Pi 变成你应用里的一个库。',
        kind: 'lab',
        status: 'planned',
        minutes: 45,
        objectives: [
          '在一个 Node 服务里嵌入 Pi，接管输入输出与工具集',
          '把事件流转成自己前端的实时更新',
          '设计会话隔离与并发上限',
        ],
        outline: [
          'SDK 入口与最小示例',
          '替换工具集：只给它该有的能力',
          '事件流接进 SSE / WebSocket',
          '多用户：会话隔离、并发、排队',
          '一个真实集成的参考：OpenClaw',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'rpc-integration',
        title: 'RPC 模式：非 Node 宿主怎么接',
        summary:
          '宿主是 Go、Python、Rust 也照样能用 —— 一条 stdin/stdout 上的 JSON 协议而已。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '用非 JS 语言起一个 Pi 子进程并完成一轮完整对话',
          '处理协议里的错误、超时与进程退出',
          '在 SDK 与 RPC 之间做出选择',
        ],
        outline: [
          'RPC 协议的消息类型',
          '子进程管理：启动、心跳、退出',
          '背压与大输出',
          '跨语言集成的坑：编码、缓冲、信号',
        ],
        refs: [pi('docs/rpc.md')],
      },
      {
        id: 'sandbox',
        title: '沙箱与隔离：把手脚绑在安全范围里',
        summary:
          '与其猜哪条命令危险，不如让危险命令根本没地方落地。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '为 agent 选一档隔离方案并说明它挡住了什么、挡不住什么',
          '在容器里跑 agent 并只挂载该给的目录',
          '设计凭据不落地的访问方式',
        ],
        outline: [
          '三档隔离：进程内、容器、独立主机',
          '容器方案：镜像、挂载、网络出口',
          'SSH 执行：把动作发到别的机器上',
          '凭据管理：短期令牌与代理',
          '逃逸面盘点',
        ],
        refs: [pi('examples/sandbox/'), pi('examples/ssh.ts')],
      },
      {
        id: 'mcp-or-cli',
        title: 'MCP 还是 CLI 工具：Pi 的取舍',
        summary:
          'Pi 明确不内置 MCP，理由值得认真读一遍 —— 然后你自己决定要不要加回来。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '对比 MCP 与「CLI + README」两种给工具的方式在上下文成本上的差别',
          '判断自己的场景该走哪条路',
          '需要 MCP 时，用扩展把它接进来',
        ],
        outline: [
          'MCP 解决的问题与它的开销',
          'CLI + README：让模型自己 `--help`',
          '上下文成本的定量比较',
          '生态现实：已有 MCP server 怎么复用',
          '用扩展接入 MCP',
        ],
        refs: [REF_NO_MCP, REF_PI_DOCS],
      },
      {
        id: 'eval',
        title: '给 agent 写测试：评测与回归',
        summary:
          '改一句提示词就可能让成功率掉一半，而你不会立刻知道 —— 除非有评测。',
        kind: 'lab',
        status: 'planned',
        minutes: 45,
        objectives: [
          '建一组任务用例，能自动判定成功与失败',
          '把提示词、工具、模型三者的改动都纳入回归',
          '读懂评测波动：多少差异算真的变差',
        ],
        outline: [
          '用例设计：可判定的任务长什么样',
          '判定方式：断言、快照、LLM 评委',
          '跑批与随机性：重复次数与置信',
          '把评测接进 CI',
          '常见误判来源',
        ],
        refs: [REF_EFFECTIVE_AGENTS],
      },
      {
        id: 'observability',
        title: '可观测：trace、用量与失败分类',
        summary:
          '线上 agent 出问题时，你需要的不是日志，而是能回放的一整条链路。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '为一轮 agent 执行打出可回放的完整 trace',
          '把 token 用量拆到会话、工具、模型三个维度',
          '建立失败分类，让告警指向可行动的原因',
        ],
        outline: [
          '一条 trace 该包含什么',
          '用量埋点与账单对账',
          '失败分类：模型拒绝、工具错误、超限、越权',
          '采样与隐私：哪些内容不能存',
          '告警该看哪几个指标',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'cost-latency',
        title: '成本与延迟：把账压下来',
        summary:
          '同一个任务，做对缓存和模型分层能便宜一个数量级。',
        kind: 'sim',
        status: 'planned',
        minutes: 35,
        objectives: [
          '算出单次任务成本的构成，并指出最值得优化的那一项',
          '设计缓存友好的上下文布局',
          '用模型分层把简单步骤交给便宜模型',
        ],
        outline: [
          '成本构成：输入、输出、缓存、重试',
          '缓存友好的上下文顺序：稳定的放前面',
          '模型分层：路由规则与质量兜底',
          '延迟优化：并行工具、流式、预取',
          '给自己设预算上限',
        ],
        refs: [REF_PI_DOCS],
      },
    ],
  },

  /* ══════════════════ L4 ══════════════════ */
  {
    id: 'l4-field',
    level: 'L4',
    title: '真实战场',
    subtitle: '编码、运维、记忆与失控',
    goal:
      '最后一段进具体场景：编码 agent 怎么闭环、运维 agent 的危险边界在哪、长期记忆该存什么。收尾那节把前面所有零件拼成你自己的 harness —— 从 Pi 毕业。',
    lessons: [
      {
        id: 'coding-agent',
        title: '编码 agent：改代码要闭环',
        summary:
          '会写代码不难，难的是改完自己验证。测试就是编码 agent 的眼睛。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '设计一条「改动 → 验证 → 修正」的闭环，并让 agent 自己跑完',
          '在整文件重写与精确补丁之间做出选择',
          '为大仓库设计定位代码的检索策略',
        ],
        outline: [
          '定位：检索、符号、依赖图',
          '编辑：整文件 vs diff/patch',
          '验证：类型检查、单测、构建',
          '失败回灌：把报错原样喂回去',
          '大改动的分步推进与随时可停',
        ],
        refs: [REF_PI_REPO],
      },
      {
        id: 'ops-agent',
        title: '运维 agent：接上真实集群之后',
        summary:
          '让 agent 碰生产环境之前，先把「哪些动作必须人点头」写成代码。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '给运维动作分级，并把不可逆动作挡在确认门后',
          '设计只读诊断与写入变更分离的工具集',
          '为一次自动化处置写出可审计的记录',
        ],
        outline: [
          '只读优先：先让它会查，再让它会改',
          '动作分级与确认门',
          '接 k8s / SSH 的现实做法',
          '变更留痕与回滚',
          '值班场景：什么该自动、什么该叫人',
        ],
        refs: [{ label: 'Kubepath — K8s 工程师成长路径', href: 'https://kubepath.wutz.dev/' }],
      },
      {
        id: 'multi-agent',
        title: '多 agent 协作与它的真实代价',
        summary:
          '拆成多个角色看着很美，但交接处丢的信息、翻倍的成本都得有人付。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '判断一个任务是否真的需要多个 agent',
          '设计交接协议，把上下文损耗降到可接受',
          '识别多 agent 系统里最常见的三种失败',
        ],
        outline: [
          '单 agent 加长上下文 vs 多 agent 分工',
          '交接协议：结构化产物而不是自然语言转述',
          '成本与延迟的乘法效应',
          '常见失败：目标漂移、互相等待、责任真空',
          '什么时候退回单 agent',
        ],
        refs: [REF_EFFECTIVE_AGENTS],
      },
      {
        id: 'memory-rag',
        title: '长期记忆与检索：什么该进提示词',
        summary:
          '记住一切等于什么都记不住。记忆系统的价值在于取舍。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '区分会话内状态、项目知识与长期偏好三类记忆，各用不同存法',
          '设计一次检索注入，控制它占用的上下文预算',
          '避免记忆污染：过时的偏好比没有偏好更糟',
        ],
        outline: [
          '三类记忆与各自的载体',
          '写入时机：谁决定这条值得记',
          '检索注入：预算、去重、时效',
          '记忆污染与失效',
          'RAG 在 agent 里的位置',
        ],
        refs: [REF_PI_DOCS],
      },
      {
        id: 'quest-runaway',
        title: '闯关：失控的 agent',
        summary:
          '半夜的无人值守任务烧掉了大半个月预算，还改了不该改的目录。复盘并加固。',
        kind: 'quest',
        status: 'planned',
        minutes: 35,
        objectives: [
          '从用量与审计记录里还原失控过程',
          '找出四道本该拦住它的防线各自为什么没生效',
          '产出加固清单并验证',
        ],
        outline: [
          '现场：账单曲线与审计日志',
          '还原时间线',
          '四道防线复查：预算、轮次、权限、沙箱',
          '加固与回归',
          '把这次事故写成一条检查项',
        ],
        refs: [],
      },
      {
        id: 'build-your-own',
        title: '造你自己的 harness：从 Pi 毕业',
        summary:
          '把前面所有零件按自己的工作流重新拼一遍 —— 这才是这门课的目的。',
        kind: 'lab',
        status: 'planned',
        minutes: 60,
        objectives: [
          '定义自己 harness 的边界：内核放什么、扩展放什么',
          '拼出一个能日常用的 agent，并说明每个取舍的理由',
          '给它写下第一版评测与预算上限',
        ],
        outline: [
          '先写清楚你的工作流',
          '内核最小化：什么必须硬编码',
          '扩展点设计：留给未来的自己',
          '组装、评测、上预算',
          '往后怎么迭代',
        ],
        refs: [REF_PI, REF_PI_REPO],
      },
    ],
  },
]

/* ---------- 派生查询 ---------- */

export const allLessons = tracks.flatMap((track) =>
  track.lessons.map((lesson) => ({ track, lesson })),
)

export function getTrack(trackId: string): Track | undefined {
  return tracks.find((t) => t.id === trackId)
}

export function getLesson(trackId: string, lessonId: string) {
  const track = getTrack(trackId)
  if (!track) return undefined
  const index = track.lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return undefined
  return {
    track,
    lesson: track.lessons[index],
  }
}

/** 全局线性顺序，用于「上一课 / 下一课」跨阶段跳转 */
export function getFlatNeighbors(trackId: string, lessonId: string) {
  const index = allLessons.findIndex(
    (item) => item.track.id === trackId && item.lesson.id === lessonId,
  )
  return {
    index,
    prev: index > 0 ? allLessons[index - 1] : undefined,
    next: index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : undefined,
  }
}

export function lessonKey(trackId: string, lessonId: string) {
  return `${trackId}/${lessonId}`
}

export const stats = {
  trackCount: tracks.length,
  lessonCount: allLessons.length,
  readyCount: allLessons.filter(({ lesson }) => lesson.status === 'ready').length,
  handsOnCount: allLessons.filter(({ lesson }) => lesson.kind !== 'concept').length,
  totalMinutes: allLessons.reduce((sum, { lesson }) => sum + lesson.minutes, 0),
}
