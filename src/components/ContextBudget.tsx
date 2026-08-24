import { useState } from 'react'
import {
  type BudgetInput,
  DEFAULT_BUDGET,
  EATER_ADVICE,
  formatTokens,
  formatUsd,
  planBudget,
} from '#/lib/context-budget'

/** 三种常见形态，点一下把整组参数换掉 */
const PRESETS: { id: string; label: string; desc: string; input: BudgetInput }[] = [
  {
    id: 'coding',
    label: '编码 agent',
    desc: '20 万窗口，工具多，读文件狠',
    input: DEFAULT_BUDGET,
  },
  {
    id: 'small',
    label: '小窗口模型',
    desc: '3.2 万窗口，第几轮就撑不住',
    input: {
      ...DEFAULT_BUDGET,
      windowK: 32,
      reserveOutput: 4000,
      toolCount: 6,
      toolOutputTokens: 1200,
      bigReadTokens: 6000,
      priceIn: 0.5,
      priceOut: 1.5,
    },
  },
  {
    id: 'tool-heavy',
    label: '工具堆到 40 个',
    desc: '常见的 MCP 全量注册形态',
    input: {
      ...DEFAULT_BUDGET,
      toolCount: 40,
      tokensPerTool: 320,
    },
  },
]

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-body mb-1 block text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-mute mt-1 block text-[11px]">{hint}</span>}
    </label>
  )
}

/* DESIGN.md 的 form-input：line 边框、6px 圆角、focus 时才亮出品牌色 */
const inputCls =
  'border-line bg-canvas text-ink focus:border-brand-600 focus:ring-brand-100 w-full rounded-sm border px-3 py-2 font-mono text-sm outline-none focus:ring-2'

/**
 * 上下文预算推算器。
 *
 * 核心不是算出一个漂亮的总数，而是回答两个问题：
 * 1. 不做压缩的话，第几轮撞墙
 * 2. 窗口被谁吃掉了 —— 排第一的那项决定了你该去优化什么
 */
export function ContextBudget() {
  const [input, setInput] = useState<BudgetInput>(DEFAULT_BUDGET)
  const result = planBudget(input)

  const set = <K extends keyof BudgetInput>(key: K, value: BudgetInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const num = (key: keyof BudgetInput, min: number, max: number) => ({
    type: 'number' as const,
    min,
    max,
    value: input[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, Math.min(max, Math.max(min, Number(e.target.value) || min)) as never),
    className: inputCls,
  })

  const maxPrompt = Math.max(...result.series.map((s) => s.prompt), result.usable)

  return (
    <section className="bg-canvas shadow-card my-6 overflow-hidden rounded-md">
      <header className="border-line flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow">计算器</span>
          <span className="text-ink text-sm font-medium">上下文预算推算</span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULT_BUDGET)}
          className="text-mute hover:text-ink text-xs transition"
        >
          重置
        </button>
      </header>

      <div className="border-line flex gap-2 overflow-x-auto border-b px-4 py-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setInput(preset.input)}
            className="border-line hover:border-brand-600 hover:bg-soft shrink-0 rounded-sm border px-3 py-1.5 text-left transition"
          >
            <span className="text-ink block text-xs font-medium">{preset.label}</span>
            <span className="text-mute block text-[11px]">{preset.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        {/* ---------- 输入 ---------- */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="上下文窗口（k token）">
              <input {...num('windowK', 4, 2000)} />
            </Field>
            <Field label="单轮输出预留" hint="窗口是输入输出共享的">
              <input {...num('reserveOutput', 512, 64000)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="系统提示词">
              <input {...num('systemTokens', 0, 40000)} />
            </Field>
            <Field label="AGENTS.md / 项目指令">
              <input {...num('projectTokens', 0, 40000)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="工具数量">
              <input {...num('toolCount', 0, 200)} />
            </Field>
            <Field label="单个工具声明" hint="description + schema">
              <input {...num('tokensPerTool', 20, 2000)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="每轮对话文本" hint="用户输入 + 模型回话">
              <input {...num('turnTextTokens', 0, 20000)} />
            </Field>
            <Field label="每轮工具输出（均值）">
              <input {...num('toolOutputTokens', 0, 60000)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="大块读取单次" hint="读整文件 / grep 全仓">
              <input {...num('bigReadTokens', 0, 200000)} />
            </Field>
            <Field label="每几轮来一次" hint="0 = 不发生">
              <input {...num('bigReadEvery', 0, 50)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="压缩触发线" hint="占可用预算的比例">
              <select
                value={input.compactAt}
                onChange={(e) => set('compactAt', Number(e.target.value))}
                className={inputCls}
              >
                {[0.6, 0.7, 0.8, 0.9, 0.95].map((v) => (
                  <option key={v} value={v}>
                    {Math.round(v * 100)}%
                  </option>
                ))}
              </select>
            </Field>
            <Field label="压缩后保留历史">
              <select
                value={input.compactKeep}
                onChange={(e) => set('compactKeep', Number(e.target.value))}
                className={inputCls}
              >
                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((v) => (
                  <option key={v} value={v}>
                    {Math.round(v * 100)}%
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="模拟轮数">
              <input {...num('rounds', 5, 200)} />
            </Field>
            <Field label="输入价 $/M">
              <input {...num('priceIn', 0, 100)} />
            </Field>
            <Field label="输出价 $/M">
              <input {...num('priceOut', 0, 500)} />
            </Field>
          </div>
        </div>

        {/* ---------- 结论 ---------- */}
        <div className="space-y-3">
          {/* 结论用墨黑面反白，是这个组件里唯一的「极性翻转」——DESIGN.md 的 dark band 做法 */}
          <div className="bg-ink rounded-md px-4 py-5 text-center">
            <div className="font-mono text-[11px] tracking-wider text-white/50 uppercase">
              不压缩的话，撑到第几轮
            </div>
            <div className="mt-1.5 text-4xl font-semibold tracking-tight text-white">
              {result.wallAt === 0 ? `> ${input.rounds}` : result.wallAt}
            </div>
            <div className="mt-1.5 text-xs text-white/60">
              可用输入预算 {formatTokens(result.usable)} · 固定开销{' '}
              {formatTokens(result.fixed)}（{Math.round(result.fixedRatio * 100)}%） · 每轮增长约{' '}
              {formatTokens(result.perRound)}
            </div>
          </div>

          <div className="border-line rounded-md border px-3.5 py-3">
            <div className="text-body text-xs font-medium">窗口被谁吃掉了</div>
            <ul className="mt-2 space-y-1.5">
              {result.breakdown.map((item) => {
                const hit = item.id === result.topEater
                const ratio = result.usable > 0 ? Math.min(1, item.tokens / result.usable) : 0
                return (
                  <li key={item.id} className="text-xs">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={hit ? 'text-brand-700 font-medium' : 'text-body'}>
                        {hit && '▸ '}
                        {item.label}
                      </span>
                      <span
                        className={`font-mono ${hit ? 'text-brand-700 font-medium' : 'text-mute'}`}
                      >
                        {formatTokens(item.tokens)}
                      </span>
                    </div>
                    <div className="bg-soft-2 mt-1 h-1 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${hit ? 'bg-brand-600' : 'bg-line-strong'}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="text-mute mt-2.5 text-[11px] leading-relaxed">
              {EATER_ADVICE[result.topEater]}
            </p>
          </div>

          {/* 逐轮占用曲线：压缩点用竖线标出来 */}
          <div className="border-line rounded-md border px-3.5 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-body text-xs font-medium">逐轮窗口占用</span>
              <span className="text-mute font-mono text-[11px]">
                压缩 {result.compactCount} 次
                {result.firstCompactAt > 0 && ` · 首次在第 ${result.firstCompactAt} 轮`}
              </span>
            </div>
            <div className="mt-2 flex h-16 items-end gap-px">
              {result.series.map((s) => (
                <div
                  key={s.round}
                  title={`第 ${s.round} 轮：${formatTokens(s.prompt)}${s.compacted ? '（压缩）' : ''}`}
                  className="flex-1"
                >
                  <div
                    className={`w-full rounded-t-[1px] ${
                      s.overflow
                        ? 'bg-danger'
                        : s.compacted
                          ? 'bg-plum-deep'
                          : s.prompt > result.usable * input.compactAt
                            ? 'bg-warn'
                            : 'bg-brand-500'
                    }`}
                    style={{ height: `${Math.max(2, (s.prompt / maxPrompt) * 64)}px` }}
                  />
                </div>
              ))}
            </div>
            <div className="text-mute mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="bg-brand-500 h-2 w-2 rounded-full" />
                正常
              </span>
              <span className="flex items-center gap-1">
                <span className="bg-warn h-2 w-2 rounded-full" />
                过触发线
              </span>
              <span className="flex items-center gap-1">
                <span className="bg-plum-deep h-2 w-2 rounded-full" />
                这一轮压缩
              </span>
              <span className="flex items-center gap-1">
                <span className="bg-danger h-2 w-2 rounded-full" />
                已超预算
              </span>
            </div>
          </div>

          <dl className="divide-line border-line divide-y rounded-md border text-sm">
            {[
              ['固定开销', `${formatTokens(result.fixed)}（每轮重发，可被缓存）`],
              [
                `${input.rounds} 轮总花费`,
                `${formatUsd(result.totalCost)}（含缓存命中）`,
              ],
              ['若完全不命中缓存', formatUsd(result.costWithoutCache)],
              [
                '缓存省下',
                `${formatUsd(result.costWithoutCache - result.totalCost)} · ${Math.round(
                  (1 - result.totalCost / Math.max(result.costWithoutCache, 1e-9)) * 100,
                )}%`,
              ],
              ['单轮均价', formatUsd(result.totalCost / input.rounds)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-3.5 py-2">
                <dt className="text-mute shrink-0 text-xs">{label}</dt>
                <dd className="text-ink text-right font-mono text-xs font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {result.warnings.length > 0 && (
            <ul className="border-warn-soft bg-warn-soft/40 text-warn-deep space-y-1.5 rounded-md border px-3.5 py-3 text-xs">
              {result.warnings.map((warning) => (
                <li key={warning} className="flex gap-1.5">
                  <span className="shrink-0">⚠</span>
                  <span className="leading-relaxed">{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
