import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  allLessons,
  lessonKey,
  stats,
  tracks,
} from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  component: Home,
})

/** 首页明说这门课的三条前提，省得读者自己猜 */
const PREMISES: { title: string; desc: string }[] = [
  {
    title: '不讲怎么用 agent，讲怎么造 agent',
    desc: '提示词技巧这里不教。这门课的读者是要自己写 loop、写工具、决定权限边界的人。',
  },
  {
    title: '底座是 Pi，因为它的内核足够小',
    desc: 'sub-agent、plan mode、权限门、沙箱在 Pi 里全都是扩展。能拆开的东西才讲得清。',
  },
  {
    title: '每一段都要落到能跑的代码',
    desc: '八十行的最小 loop、你的第一个扩展、嵌进自己应用的 SDK —— 看完要有产物。',
  },
]

function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)
  const doneCount = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const percent = Math.round((doneCount / stats.lessonCount) * 100)
  const nextUp =
    allLessons.find(({ track, lesson }) => !doneSet.has(lessonKey(track.id, lesson.id))) ??
    allLessons[0]

  return (
    <div className="space-y-10">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} levels · {stats.handsOnCount} hands-on
        </div>
        <h1 className="display-2xl mt-3">造一个 agent。</h1>
        <p className="text-body mt-4 max-w-2xl text-[17px] leading-relaxed">
          agent 说到底就是一个 while 循环：让模型决定下一步调什么工具，直到它认为完事了。
          难的从来不是这个循环，而是循环外面那一圈 —— 上下文怎么省、工具怎么设计、
          权限在哪道门上拦、失控了谁来兜。这门课拿 <strong>Pi</strong> 当解剖对象，
          从 {stats.lessonCount} 节课里把这一圈补齐。
        </p>
      </section>

      <section className="grid gap-2 sm:grid-cols-3">
        {PREMISES.map((premise) => (
          <div key={premise.title} className="bg-canvas shadow-card rounded-md px-4 py-3.5">
            <div className="text-ink text-sm font-medium">{premise.title}</div>
            <p className="text-body mt-1.5 text-xs leading-relaxed">{premise.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-canvas shadow-soft rounded-lg px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="display-md">L0 → L4，一条线走完</h2>
          <span className="text-mute font-mono text-xs">
            {stats.lessonCount} 节 · 约 {Math.round(stats.totalMinutes / 60)} 小时 · 已完成{' '}
            {doneCount}/{stats.lessonCount}
          </span>
        </div>
        <p className="text-body mt-2 max-w-2xl text-sm leading-relaxed">
          先划清 agent 的定义并把 Pi 跑起来（L0），自己写一个最小 loop 再对着 Pi 的实现读（L1），
          然后用扩展把它改成自己的形状（L2），补上沙箱、评测、成本这些上线前必须有的东西（L3），
          最后进真实场景，收尾时把零件拼成你自己的 harness（L4）。
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="bg-soft-2 h-1 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-brand-600 h-full rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-mute font-mono text-[11px]">{percent}%</span>
        </div>
        {nextUp && (
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
            className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex items-center rounded-sm px-4 py-2.5 text-sm font-medium text-white transition"
          >
            {doneCount > 0 ? '继续' : '从第一节开始'} · {nextUp.track.level}{' '}
            {nextUp.lesson.title}
          </Link>
        )}
      </section>

      <section className="space-y-8">
        {tracks.map((track) => {
          const trackDone = track.lessons.filter((lesson) =>
            doneSet.has(lessonKey(track.id, lesson.id)),
          ).length

          return (
            <div key={track.id}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="eyebrow">{track.level}</span>
                <Link
                  to="/tracks/$trackId"
                  params={{ trackId: track.id }}
                  className="display-sm hover:text-brand-600 transition"
                >
                  {track.title}
                </Link>
                <span className="text-mute font-mono text-[11px]">
                  {track.lessons.length} 节 · 已完成 {trackDone}/{track.lessons.length}
                </span>
              </div>
              <p className="text-body mt-1 max-w-3xl text-sm leading-relaxed">{track.goal}</p>

              <ol className="divide-line bg-canvas shadow-card mt-3 divide-y overflow-hidden rounded-md">
                {track.lessons.map((lesson, index) => {
                  const done = doneSet.has(lessonKey(track.id, lesson.id))
                  return (
                    <li key={lesson.id}>
                      <Link
                        to="/learn/$trackId/$lessonId"
                        params={{ trackId: track.id, lessonId: lesson.id }}
                        className="hover:bg-soft flex items-center gap-3 px-4 py-2.5 transition sm:px-5"
                      >
                        <Marker done={done}>{index + 1}</Marker>
                        <span className="min-w-0 flex-1">
                          <span className="text-ink block truncate text-sm">{lesson.title}</span>
                          <span className="text-mute block truncate text-xs">{lesson.summary}</span>
                        </span>
                        <KindBadge kind={lesson.kind} />
                        <span className="text-mute shrink-0 font-mono text-[11px]">
                          {lesson.minutes}m
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </section>

      <p className="text-mute text-xs leading-relaxed">
        {stats.readyCount} 节已有正文，其余为定稿大纲 —— 打开也能看到这一节会讲什么。
        进度存在浏览器 localStorage，没有账号体系。
      </p>
    </div>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        done ? 'bg-brand-600 text-white' : 'bg-soft-2 text-mute'
      }`}
    >
      {done ? '✓' : children}
    </span>
  )
}

/** 「原理」是默认形态，只给动手环节挂徽标 */
function KindBadge({ kind }: { kind: keyof typeof KIND_LABEL }) {
  if (kind === 'concept') return null
  return (
    <span
      className={`rounded-xs hidden shrink-0 px-1.5 py-0.5 text-[10px] sm:inline ${KIND_STYLE[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
}
