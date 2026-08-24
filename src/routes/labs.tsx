import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_STYLE,
  LEVEL_CHIP,
  allLessons,
  lessonKey,
  type LessonKind,
} from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/labs')({
  component: LabsPage,
})

const SECTIONS: { kind: LessonKind; eyebrow: string; title: string; desc: string }[] = [
  {
    kind: 'lab',
    eyebrow: 'Lab',
    title: '动手实现',
    desc: '需要一个能跑 Node 的环境和至少一个模型 API key，跟着做完会留下能用的产物。',
  },
  {
    kind: 'quest',
    eyebrow: 'Quest',
    title: '故障闯关',
    desc: '在模拟环境里接手一个出问题的 agent —— 死循环、烧钱、越权，按目标一步步定位根因。',
  },
  {
    kind: 'sim',
    eyebrow: 'Sim',
    title: '推演与计算器',
    desc: '改参数看结果：一轮循环断在哪、上下文被谁吃掉、这一趟到底花多少钱。',
  },
]

function LabsPage() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-10">
      <header>
        <div className="eyebrow">Hands-on</div>
        <h1 className="display-2xl mt-3">动手的部分。</h1>
        <p className="text-body mt-4 max-w-2xl text-[17px] leading-relaxed">
          agent 这东西看别人讲一百遍都不如自己让它跑崩一次。这里把全部动手环节汇总在一起，
          你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="eyebrow">{section.eyebrow}</span>
              <h2 className="display-md">{section.title}</h2>
            </div>
            <p className="text-body mt-1 text-sm leading-relaxed">{section.desc}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="bg-canvas shadow-card hover:shadow-float flex flex-col rounded-md px-5 py-4 transition"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={LEVEL_CHIP}>{track.level}</span>
                      <span className="text-mute font-mono">{track.title}</span>
                      {done && (
                        <span className="rounded-xs bg-brand-50 text-brand-700 px-1.5 py-0.5">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="rounded-xs bg-soft-2 text-mute px-1.5 py-0.5">仅大纲</span>
                      )}
                      <span
                        className={`rounded-xs ml-auto px-1.5 py-0.5 ${KIND_STYLE[lesson.kind]}`}
                      >
                        {lesson.minutes} 分钟
                      </span>
                    </div>
                    <h3 className="display-sm mt-2.5">{lesson.title}</h3>
                    <p className="text-body mt-1.5 text-sm leading-relaxed">{lesson.summary}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
