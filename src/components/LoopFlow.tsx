import { useState } from 'react'

/**
 * agent loop 推演 —— 一轮循环的分步走查。
 *
 * 两种玩法：
 * 1. 按步推进，看每一步是谁在动、这一步之后状态变成什么样
 * 2. 点掉某个环节，看这一轮会断在哪、现象是什么
 *
 * 目的是把「循环里其实只有五个动作」「退出条件是代码的责任而不是模型的」
 * 这类结论，变成可以自己点出来的东西。
 */

type StageId = 'assemble' | 'model' | 'dispatch' | 'execute' | 'guard'

const STAGES: { id: StageId; label: string; where: string }[] = [
  { id: 'assemble', label: 'assembleContext', where: 'harness' },
  { id: 'model', label: 'callModel', where: '模型提供方' },
  { id: 'dispatch', label: 'readStopReason', where: 'harness' },
  { id: 'execute', label: 'runTools', where: '本机 / 沙箱' },
  { id: 'guard', label: 'checkLimits', where: 'harness' },
]

interface Step {
  actor: StageId
  title: string
  detail: string
  /** 这一步之后循环的状态 */
  state: string
  /** 这个环节缺失或写错时的表现 */
  broken: string
}

const STEPS: Step[] = [
  {
    actor: 'assemble',
    title: '组装上下文',
    detail:
      '系统提示词、AGENTS.md、工具声明、历史消息按固定顺序拼成一次请求。顺序不是随便定的 —— 稳定的内容放前面才能命中 prompt 缓存。',
    state: 'messages 数组就绪，输入 token 数已确定',
    broken:
      '上下文超出窗口，请求直接被拒。表现是任务跑到第十几轮突然全线报错 —— 没做 compaction 的 agent 都死在这里。',
  },
  {
    actor: 'model',
    title: '请求模型',
    detail:
      '把 messages 和工具声明发给模型，流式接回文本增量与工具调用。这是循环里唯一一次「模型说话」的机会，它要么给出答案，要么要求调工具。',
    state: '拿到 assistant 消息，stop_reason 是 tool_use 或 end_turn',
    broken:
      '限流、超时或余额不足。区别很重要：可重试的错误要退避重试，不可重试的要立刻停下并告诉人，别在循环里反复烧钱。',
  },
  {
    actor: 'dispatch',
    title: '看 stop_reason 决定去哪',
    detail:
      'end_turn 就是这一轮结束、把控制权交回人；tool_use 才继续往下走。判断的主体是 harness 的代码，不是模型 —— 模型只是提供了一个字段。',
    state: '分岔已定：结束本轮，或带着待执行的工具调用继续',
    broken:
      '把「模型说了句话」当成任务完成，或者反过来永远不认为结束。前者半途而废，后者是死循环的经典成因。',
  },
  {
    actor: 'execute',
    title: '执行工具',
    detail:
      '按模型给的参数跑工具，可以并行。执行结果（包括报错）必须原样回灌成 tool_result —— 这是模型唯一的反馈渠道，也是它自我纠错的依据。',
    state: '每个 tool_use 都有一条对应的 tool_result，成功或失败',
    broken:
      '工具挂了却没把错误回灌，模型收到空结果，只能瞎猜着重试同一个调用。这就是「同一个工具连调二十次」的现场。',
  },
  {
    actor: 'guard',
    title: '过一遍保险，再决定要不要下一轮',
    detail:
      '轮次上限、token 预算、墙钟超时、用户是否插话（steering）—— 四道检查全过了才回到第一步。人的插话会落在这里：打断当前工具，剩下的工具作废。',
    state: '回到第一步开始下一轮，或者带着原因停下来',
    broken:
      '没有保险的循环没有上限。半夜跑的无人值守任务能把一个月预算烧完，而且没人会收到通知。',
  },
]

/*
 * 五个环节原本各给一种颜色，但颜色只在「它正在动」时才有意义 ——
 * 色相本身没编码信息。收成一种高亮：有颜色的那个就是当前这一步的执行者。
 */
const ACTOR_ACTIVE = 'border-brand-600 bg-brand-50 text-brand-700'

export function LoopFlow() {
  const [at, setAt] = useState(0)
  const [down, setDown] = useState<StageId | null>(null)

  // 这一轮断在第一个出问题的环节
  const brokenAt = down ? STEPS.findIndex((step) => step.actor === down) : -1
  const blocked = brokenAt >= 0 && at >= brokenAt
  const step = STEPS[at]

  return (
    <section className="bg-canvas shadow-card my-6 overflow-hidden rounded-md">
      <header className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow">推演</span>
          <span className="text-body font-mono text-xs">while (!done) &#123; ... &#125;</span>
        </div>
        <span className="text-mute font-mono text-[11px]">
          第 {at + 1} / {STEPS.length} 步
        </span>
      </header>

      <div className="border-line bg-soft border-b px-4 py-3">
        <div className="text-mute text-[11px]">点环节可以把它「打挂」，看这一轮断在哪</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STAGES.map((stage) => {
            const isDown = down === stage.id
            const isActor = step.actor === stage.id && !blocked
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setDown(isDown ? null : stage.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                  isDown
                    ? 'border-danger bg-danger-soft/40 text-danger-deep line-through'
                    : isActor
                      ? ACTOR_ACTIVE
                      : 'border-line bg-canvas text-mute hover:border-line-strong'
                }`}
              >
                <span className="block font-mono">{stage.label}</span>
                <span className="block text-[10px] opacity-70">{stage.where}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ol className="border-line flex gap-1 border-b px-4 py-3">
        {STEPS.map((s, i) => {
          const reachable = brokenAt < 0 || i < brokenAt
          return (
            <li key={s.title} className="flex-1">
              <button
                type="button"
                onClick={() => setAt(i)}
                className="w-full text-left"
                title={s.title}
              >
                <div
                  className={`h-1 rounded-full transition ${
                    !reachable ? 'bg-danger-soft' : i <= at ? 'bg-brand-600' : 'bg-soft-2'
                  }`}
                />
                <span
                  className={`mt-1.5 block truncate text-[10px] ${
                    i === at ? 'text-ink font-medium' : 'text-mute'
                  }`}
                >
                  {i + 1}. {s.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded border px-2 py-0.5 font-mono text-xs ${ACTOR_ACTIVE}`}>
            {STAGES.find((s) => s.id === step.actor)?.label}
          </span>
          <h4 className="display-sm">{step.title}</h4>
        </div>

        <p className="text-body mt-2.5 text-sm leading-relaxed">{step.detail}</p>

        {blocked ? (
          <div className="border-danger-soft bg-danger-soft/30 mt-3 rounded-sm border px-3.5 py-3 text-sm">
            <div className="text-danger-deep font-medium">
              {STAGES.find((s) => s.id === down)?.label} 出问题，这一轮断在第 {brokenAt + 1} 步
            </div>
            <p className="text-body mt-1 leading-relaxed">{STEPS[brokenAt].broken}</p>
          </div>
        ) : (
          <div className="bg-soft mt-3 rounded-sm px-3.5 py-3 text-sm">
            <span className="text-mute text-xs">这一步之后：</span>
            <span className="text-ink ml-1.5">{step.state}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAt((v) => Math.max(0, v - 1))}
            disabled={at === 0}
            className="bg-canvas text-ink shadow-card hover:shadow-float rounded-sm px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← 上一步
          </button>
          <button
            type="button"
            onClick={() => setAt((v) => Math.min(STEPS.length - 1, v + 1))}
            disabled={at === STEPS.length - 1}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-soft-2 disabled:text-mute rounded-sm px-4 py-1.5 text-sm font-medium text-white transition disabled:cursor-not-allowed"
          >
            下一步 →
          </button>
          {down && (
            <button
              type="button"
              onClick={() => setDown(null)}
              className="text-mute hover:text-ink ml-auto text-xs transition"
            >
              恢复所有环节
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
