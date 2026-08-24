/**
 * 上下文预算推算 —— 把「第几轮撞墙、谁在吃窗口、这一趟花多少钱」算清楚。
 *
 * 口径说明：
 * - token 一律按整数计，不区分中英文（真实分词比这复杂，但结论不变）
 * - 窗口是**输入 + 输出共享**的：可用输入预算 = 窗口 − 单轮输出预留
 * - 「固定开销」= 系统提示词 + AGENTS.md + 工具声明。它每一轮都要重发，
 *   但内容不变，所以是 prompt 缓存唯一真正能命中的那一段
 * - compaction 一旦发生，缓存前缀就变了 —— 那一轮的输入按全价重算。
 *   这是很多人算漏的一笔：压缩省下的窗口，是用一次全价换来的
 */

export interface BudgetInput {
  /** 上下文窗口，单位 k token */
  windowK: number
  /** 每轮为输出预留的 token */
  reserveOutput: number
  /** 系统提示词 */
  systemTokens: number
  /** AGENTS.md / 项目指令 */
  projectTokens: number
  /** 工具数量 */
  toolCount: number
  /** 单个工具声明（name + description + schema）的平均 token */
  tokensPerTool: number
  /** 每轮的对话文本：用户输入 + 模型自然语言输出 */
  turnTextTokens: number
  /** 每轮工具输出的平均 token */
  toolOutputTokens: number
  /** 偶发的大块读取（读文件、grep 全仓）单次 token */
  bigReadTokens: number
  /** 每隔几轮出现一次大块读取，0 表示不发生 */
  bigReadEvery: number
  /** 占用达到可用预算的多少比例时触发 compaction（0–1） */
  compactAt: number
  /** compaction 之后历史保留多少比例（0–1） */
  compactKeep: number
  /** 模拟多少轮 */
  rounds: number
  /** 输入价格，美元 / 百万 token */
  priceIn: number
  /** 输出价格，美元 / 百万 token */
  priceOut: number
  /** 缓存读取价格相对输入价格的折扣（0.1 = 一折） */
  cacheDiscount: number
}

export interface RoundState {
  round: number
  /** 这一轮实际发出去的输入 token */
  prompt: number
  /** 其中按全价计费的部分 */
  fresh: number
  /** 其中命中缓存的部分 */
  cached: number
  /** 这一轮是否触发了 compaction */
  compacted: boolean
  /** 这一轮是否已经超出可用预算（模拟到此为止） */
  overflow: boolean
  /** 累计花费（美元） */
  costSoFar: number
}

export type EaterId = 'system' | 'project' | 'tools' | 'history' | 'toolOutput'

export interface BudgetResult {
  /** 可用输入预算 = 窗口 − 输出预留 */
  usable: number
  /** 固定开销：系统提示 + 项目指令 + 工具声明 */
  fixed: number
  /** 固定开销占可用预算的比例 */
  fixedRatio: number
  /** 每轮历史增长量（不含大块读取） */
  perRound: number
  /** 不做 compaction 的话，第几轮撞墙（0 表示模拟范围内没撞上） */
  wallAt: number
  /** 第一次触发 compaction 的轮次（0 表示没触发） */
  firstCompactAt: number
  /** 模拟范围内 compaction 次数 */
  compactCount: number
  series: RoundState[]
  /** 撞墙那一刻（或最后一轮）的窗口构成 */
  breakdown: { id: EaterId; label: string; tokens: number }[]
  /** 吃得最多的那一项 */
  topEater: EaterId
  totalCost: number
  /** 如果完全没有缓存命中，同样轮数要花多少 */
  costWithoutCache: number
  warnings: string[]
}

export const EATER_LABEL: Record<EaterId, string> = {
  system: '系统提示词',
  project: 'AGENTS.md / 项目指令',
  tools: '工具声明',
  history: '对话历史',
  toolOutput: '工具输出',
}

export const EATER_ADVICE: Record<EaterId, string> = {
  system:
    '系统提示词吃掉了最大一块。它每轮都要重发 —— 好在它稳定，缓存能兜住成本，但窗口是实打实占掉的。把可选规则挪去 skill，按需装载。',
  project:
    '项目指令占比最高。AGENTS.md 容易越写越长，而且大部分内容在多数任务里用不上。留下真正的硬约束，其余转成 skill 或文档让 agent 自己去读。',
  tools:
    '工具声明是最大头 —— 这是工具数量失控的典型信号。每个工具的 description 都是提示词的一部分，二十个工具就是二十段常驻文本。按场景分组，用得上才注册。',
  history:
    '对话历史吃得最多，属于正常形态。这时候该做的是 compaction 策略，而不是砍工具或砍提示词。',
  toolOutput:
    '工具输出是最大的吃客，也是最容易压的一项。给工具的返回值加长度上限、加分页、加摘要 —— 一次 grep 全仓就能吃掉几万 token，而模型真正需要的往往只有几行。',
}

export const DEFAULT_BUDGET: BudgetInput = {
  windowK: 200,
  reserveOutput: 8000,
  systemTokens: 2600,
  projectTokens: 900,
  toolCount: 12,
  tokensPerTool: 190,
  turnTextTokens: 450,
  toolOutputTokens: 2200,
  bigReadTokens: 14000,
  bigReadEvery: 6,
  compactAt: 0.8,
  compactKeep: 0.3,
  rounds: 40,
  priceIn: 3,
  priceOut: 15,
  cacheDiscount: 0.1,
}

/** 压缩后的摘要本身也要占位置，按保留下来的历史再加一小段 */
const SUMMARY_TOKENS = 1200

export function planBudget(input: BudgetInput): BudgetResult {
  const window = Math.round(input.windowK * 1000)
  const usable = Math.max(1, window - input.reserveOutput)
  const toolsTokens = input.toolCount * input.tokensPerTool
  const fixed = input.systemTokens + input.projectTokens + toolsTokens
  const perRound = input.turnTextTokens + input.toolOutputTokens

  const priceIn = input.priceIn / 1_000_000
  const priceOut = input.priceOut / 1_000_000
  const priceCache = priceIn * input.cacheDiscount

  /* 不压缩的话第几轮撞墙 —— 线性外推，含大块读取的均摊 */
  const bigPerRound =
    input.bigReadEvery > 0 ? input.bigReadTokens / input.bigReadEvery : 0
  const growth = perRound + bigPerRound
  const wallAt =
    fixed >= usable ? 1 : growth > 0 ? Math.floor((usable - fixed) / growth) + 1 : 0

  /* 逐轮模拟：历史累积、触发压缩、缓存命中与计费 */
  const series: RoundState[] = []
  let history = 0
  let historyToolOutput = 0
  let cost = 0
  let costNoCache = 0
  let compactCount = 0
  let firstCompactAt = 0
  let lastCompacted = true // 第一轮没有可命中的前缀，按全价算
  let overflowAt = 0
  let breakdownHistory = 0
  let breakdownToolOutput = 0

  for (let round = 1; round <= input.rounds; round++) {
    const big =
      input.bigReadEvery > 0 && round % input.bigReadEvery === 0 ? input.bigReadTokens : 0
    const delta = perRound + big
    history += delta
    historyToolOutput += input.toolOutputTokens + big

    const prompt = fixed + history
    const overflow = prompt > usable

    /*
     * 缓存口径：上一轮之前的内容命中缓存，这一轮新增的按全价。
     * 压缩过的那一轮前缀变了，整个 prompt 都是全价。
     */
    const fresh = lastCompacted ? prompt : delta
    const cached = prompt - fresh
    cost += fresh * priceIn + cached * priceCache + input.reserveOutput * priceOut
    costNoCache += prompt * priceIn + input.reserveOutput * priceOut

    series.push({
      round,
      prompt,
      fresh,
      cached,
      compacted: false,
      overflow,
      costSoFar: cost,
    })

    if (overflow && !overflowAt) {
      overflowAt = round
      breakdownHistory = history - historyToolOutput
      breakdownToolOutput = historyToolOutput
    }

    lastCompacted = false

    /* 这一轮结束后检查是否该压缩，压缩发生在下一轮请求之前 */
    if (prompt > usable * input.compactAt) {
      const keptToolOutput = historyToolOutput * input.compactKeep
      history = history * input.compactKeep + SUMMARY_TOKENS
      historyToolOutput = keptToolOutput
      compactCount++
      if (!firstCompactAt) firstCompactAt = round
      series[series.length - 1].compacted = true
      lastCompacted = true
    }
  }

  const last = series[series.length - 1]
  if (!overflowAt && last) {
    breakdownHistory = Math.max(0, last.prompt - fixed - historyToolOutput)
    breakdownToolOutput = historyToolOutput
  }

  const breakdown: { id: EaterId; label: string; tokens: number }[] = [
    { id: 'system', label: EATER_LABEL.system, tokens: input.systemTokens },
    { id: 'project', label: EATER_LABEL.project, tokens: input.projectTokens },
    { id: 'tools', label: EATER_LABEL.tools, tokens: toolsTokens },
    { id: 'history', label: EATER_LABEL.history, tokens: Math.round(breakdownHistory) },
    { id: 'toolOutput', label: EATER_LABEL.toolOutput, tokens: Math.round(breakdownToolOutput) },
  ]
  const topEater = breakdown.reduce((a, b) => (b.tokens > a.tokens ? b : a)).id

  const warnings: string[] = []
  const fixedRatio = fixed / usable
  if (fixedRatio > 0.25) {
    warnings.push(
      `固定开销已占可用预算的 ${Math.round(fixedRatio * 100)}% —— 还没开始干活就吃掉了四分之一以上，留给历史的空间很紧。`,
    )
  }
  if (toolsTokens > input.systemTokens) {
    warnings.push(
      `${input.toolCount} 个工具的声明（${toolsTokens.toLocaleString()} token）比系统提示词还长。工具集该按场景分组按需注册了。`,
    )
  }
  if (input.bigReadTokens > usable * 0.15 && input.bigReadEvery > 0) {
    warnings.push(
      `单次大块读取 ${input.bigReadTokens.toLocaleString()} token，一口吃掉可用预算的 ${Math.round((input.bigReadTokens / usable) * 100)}%。给读取工具加上行数上限或分页。`,
    )
  }
  if (compactCount >= 4) {
    warnings.push(
      `${input.rounds} 轮里压缩了 ${compactCount} 次，每次都让缓存全部失效。要么把窗口用得省一点，要么换更大的窗口 —— 频繁压缩既贵又丢信息。`,
    )
  }
  if (input.compactKeep > 0.5) {
    warnings.push(
      `压缩后保留 ${Math.round(input.compactKeep * 100)}% 历史，压得太浅，很快会再次触发。`,
    )
  }

  return {
    usable,
    fixed,
    fixedRatio,
    perRound,
    wallAt: wallAt > input.rounds ? 0 : wallAt,
    firstCompactAt,
    compactCount,
    series,
    breakdown,
    topEater,
    totalCost: cost,
    costWithoutCache: costNoCache,
    warnings,
  }
}

export function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(Math.round(n))
}

export function formatUsd(n: number): string {
  if (n >= 10) return `$${n.toFixed(1)}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(3)}`
}
