import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Agentpath — 造一个 agent' },
      {
        name: 'description',
        content:
          '以 Pi（可改造的 agent harness）为底座的在线交互式学习项目：从 agent loop、工具设计、上下文预算，到扩展体系、权限沙箱、评测与成本，最后拼出你自己的 harness。',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      /* Geist / Geist Mono —— 与 kubepath / storpath 同一份字体来源 */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="bg-soft font-sans text-ink min-h-screen antialiased">
        {/* 顶栏固定 64px（DESIGN.md nav-bar）；styles.css 的 scroll-padding-top 跟着这个高度 */}
        <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src="/logo.svg" alt="" width={26} height={26} className="h-6.5 w-6.5 shrink-0" />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">Agentpath</span>
              <span className="border-line text-mute hidden border-l pl-2.5 text-xs sm:inline">
                借 Pi 造一个 agent
              </span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-soft-2 text-ink' }}
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-soft-2 text-ink' }}
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                动手与闯关
              </Link>
              <a
                href="https://pi.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                pi.dev ↗
              </a>
              <a
                href="https://wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Outlet />
        </main>

        <footer className="border-line bg-canvas mt-16 border-t sm:mt-24">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="eyebrow">Agentpath</div>
            <p className="text-body mt-3 max-w-3xl text-sm leading-relaxed">
              以 Pi 为底座的 agent 工程课。Pi 是 Earendil 开源的 agent harness（MIT）——
              内核刻意做得很小，sub-agent、plan mode、权限门、沙箱都以扩展形式存在，
              正好适合拆开来讲清楚，再照着造一个自己的。
            </p>
            <p className="text-mute mt-2 text-xs">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
