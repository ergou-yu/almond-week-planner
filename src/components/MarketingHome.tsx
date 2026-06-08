"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Bot, Download, ExternalLink, FileDown, Globe2, Laptop, Leaf, MonitorSmartphone, Sparkles, Smartphone } from "lucide-react";
import Link from "next/link";

const spring = {
  type: "spring",
  stiffness: 240,
  damping: 24
} as const;

const downloads = {
  android: "/downloads/almond-week-planner-android-v0.1.0.apk",
  windows: "/downloads/almond-week-planner-windows-x64-v0.1.0.zip",
  macArm64: "/downloads/almond-week-planner-macos-arm64-v0.1.0.dmg",
  macX64: "/downloads/almond-week-planner-macos-x64-v0.1.0.dmg",
  iosProject: "/downloads/almond-week-planner-ios-xcode-v0.1.0.zip"
};

const platformRoadmap = [
  { name: "Android APK", status: "测试包开放下载", icon: Smartphone },
  { name: "网页版", status: "已上线，可直接使用", icon: Globe2 },
  { name: "Windows", status: "x64 便携版开放下载", icon: MonitorSmartphone },
  { name: "macOS Intel / Apple Silicon", status: "DMG 测试包开放下载", icon: Laptop },
  { name: "iOS", status: "Xcode 项目已准备，App Store 待签名审核", icon: Smartphone },
  { name: "Linux", status: "即将推出", icon: MonitorSmartphone },
  { name: "HarmonyOS", status: "工具链与签名确认中", icon: Sparkles }
];

const capabilities = [
  "一个账号同步网页与 APK",
  "分享链接协作修改状态和评价",
  "导出互动 PDF 与独立 HTML",
  "多语言、优先级、完成鼓励动画"
];

export function MarketingHome() {
  return (
    <main className="app-shell min-h-dvh text-blossom-ink">
      <div className="ambient-layer" aria-hidden="true">
        <span className="branch-stroke branch-stroke-a" />
        <span className="branch-stroke branch-stroke-b" />
        <span className="branch-stroke branch-stroke-c" />
      </div>
      <div className="petal petal-a" />
      <div className="petal petal-b" />
      <div className="petal petal-d" />
      <div className="petal petal-e" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex min-w-0 items-center gap-2" href="/">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-blossom-deep/15 bg-white/82 shadow-sm">
            <Leaf className="size-5 text-blossom-leaf" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black sm:text-lg">杏花周计划</span>
            <span className="hidden text-xs text-blossom-deep/70 sm:block">Web + Android + Windows + macOS 同账号协作</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link className="hidden min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/82 px-4 text-sm font-black text-blossom-ink shadow-sm sm:inline-flex" href="/app">
            打开网页版
            <ExternalLink className="size-4" />
          </Link>
          <a className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-black text-white shadow-sm" href={downloads.android}>
            下载 APK
            <Download className="size-4" />
          </a>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100dvh-84px)] w-full max-w-7xl content-center gap-8 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <p className="mb-4 inline-flex rounded-full border border-blossom-deep/15 bg-white/76 px-3 py-1 text-xs font-black text-blossom-deep">
            梵高杏花灵感 · 一周目标协作产品
          </p>
          <h1 className="max-w-4xl text-[clamp(2.6rem,8vw,6.6rem)] font-black leading-none">
            <span className="brush-underline">把计划带到手机里</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-blossom-deep/78 sm:text-lg">
            网页版、Android APK、Windows 和 macOS 应用使用同一个线上账号，计划、状态、分享评价和导出功能保持互通。学生、家长、老师可以在不同设备上协作监督这一周。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="motion-sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blossom-ink px-6 text-sm font-black text-white shadow-brush" href="/app">
              进入网页版
              <ArrowRight className="size-4" />
            </Link>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/86 px-6 text-sm font-black text-blossom-ink shadow-sm" href={downloads.android}>
              下载 Android APK
              <FileDown className="size-4" />
            </a>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/86 px-6 text-sm font-black text-blossom-ink shadow-sm" href={downloads.macArm64}>
              下载 macOS
              <Laptop className="size-4" />
            </a>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/86 px-6 text-sm font-black text-blossom-ink shadow-sm" href={downloads.windows}>
              下载 Windows
              <MonitorSmartphone className="size-4" />
            </a>
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold text-blossom-deep/78">
                <BadgeCheck className="size-4 shrink-0 text-blossom-leaf" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="glass-panel overflow-hidden rounded-lg p-4 sm:p-5" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...spring, delay: 0.08 }}>
          <div className="rounded-lg border border-white/70 bg-white/72 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blossom-deep/60">This Week</p>
                <h2 className="mt-2 text-2xl font-black">坚定共享领导</h2>
                <p className="mt-2 text-sm leading-6 text-blossom-deep/70">阅读听力保持高分，数学竞赛稳步推进。</p>
              </div>
              <span className="rounded-full bg-blossom-sky/18 px-3 py-1 text-xs font-black text-blossom-deep">同步中</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["听力6分", "高质完成", "最高"],
                ["数学竞赛", "基本完成", "高"],
                ["阅读训练", "推迟", "普通"],
                ["自我评价", "协作中", "低"]
              ].map(([title, status, priority]) => (
                <div key={title} className="rounded-lg border border-blossom-deep/10 bg-white/82 p-3">
                  <h3 className="text-sm font-black">{title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">{status}</span>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-rose-700">{priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-blossom-deep/10 bg-white/74 p-4">
              <Bot className="size-5 text-blossom-gold" />
              <p className="mt-3 text-sm font-black">AI 合理性建议</p>
              <p className="mt-1 text-xs leading-5 text-blossom-deep/68">拆解目标、识别风险、给出下一步。</p>
            </div>
            <div className="rounded-lg border border-blossom-deep/10 bg-white/74 p-4">
              <Sparkles className="size-5 text-blossom-blush" />
              <p className="mt-3 text-sm font-black">完成鼓励动画</p>
              <p className="mt-1 text-xs leading-5 text-blossom-deep/68">任务完成后出现杏花与每日名言。</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="paper-panel rounded-lg p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blossom-deep/58">Downloads</p>
              <h2 className="mt-2 text-3xl font-black">安装包与平台路线</h2>
            </div>
            <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blossom-ink px-5 text-sm font-black text-white" href={downloads.android}>
              下载 Android 测试包
              <Download className="size-4" />
            </a>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <a className="rounded-lg border border-blossom-deep/10 bg-white/86 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-brush" href={downloads.android}>
              <Smartphone className="size-5 text-blossom-deep" />
              <h3 className="mt-4 text-sm font-black">Android APK</h3>
              <p className="mt-2 text-xs leading-5 text-blossom-deep/66">测试签名包，安装后打开同一个线上应用。</p>
            </a>
            <a className="rounded-lg border border-blossom-deep/10 bg-white/86 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-brush" href={downloads.windows}>
              <MonitorSmartphone className="size-5 text-blossom-deep" />
              <h3 className="mt-4 text-sm font-black">Windows x64</h3>
              <p className="mt-2 text-xs leading-5 text-blossom-deep/66">便携 ZIP，解压后运行 Almond Week Planner.exe。</p>
            </a>
            <a className="rounded-lg border border-blossom-deep/10 bg-white/86 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-brush" href={downloads.macArm64}>
              <Laptop className="size-5 text-blossom-deep" />
              <h3 className="mt-4 text-sm font-black">macOS Apple Silicon</h3>
              <p className="mt-2 text-xs leading-5 text-blossom-deep/66">适用于 M 系列芯片 Mac 的 DMG 测试包。若提示无法验证，请右键打开或在隐私与安全性里允许。</p>
            </a>
            <a className="rounded-lg border border-blossom-deep/10 bg-white/86 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-brush" href={downloads.macX64}>
              <Laptop className="size-5 text-blossom-deep" />
              <h3 className="mt-4 text-sm font-black">macOS Intel</h3>
              <p className="mt-2 text-xs leading-5 text-blossom-deep/66">适用于 Intel 芯片 Mac 的 DMG 测试包。若提示无法验证，请右键打开或在隐私与安全性里允许。</p>
            </a>
            <a className="rounded-lg border border-blossom-deep/10 bg-white/86 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-brush" href={downloads.iosProject}>
              <Smartphone className="size-5 text-blossom-deep" />
              <h3 className="mt-4 text-sm font-black">iOS Xcode 项目</h3>
              <p className="mt-2 text-xs leading-5 text-blossom-deep/66">可交给 Xcode 配置签名，TestFlight / App Store 需要 Apple Developer。</p>
            </a>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {platformRoadmap.map(({ name, status, icon: Icon }) => (
              <div key={name} className="rounded-lg border border-blossom-deep/10 bg-white/78 p-4">
                <Icon className="size-5 text-blossom-deep" />
                <h3 className="mt-4 text-sm font-black">{name}</h3>
                <p className="mt-2 text-xs leading-5 text-blossom-deep/66">{status}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-blossom-deep/64">
            Android、Windows 与 macOS 目前为测试签名包。macOS 测试包尚未 Apple notarization，首次打开可能需要右键打开或到系统设置的隐私与安全性里点允许。Windows 便携版未做代码签名，首次打开可能出现 SmartScreen 提示。iOS 安装包和 App Store 上架需要 Apple Developer 证书、Bundle ID、隐私信息、截图与审核；当前先提供可签名的 Xcode 项目包。Linux 与 HarmonyOS 将沿用同账号体系，后续按平台签名和分发要求发布。
          </p>
        </div>
      </section>
    </main>
  );
}
