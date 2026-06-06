"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { path: "/", name: "首页总览" },
  { path: "/identity", name: "链上身份" },
  { path: "/resume", name: "简历仪表盘" },
  { path: "/portfolio", name: "成果作品" },
  { path: "/reputation", name: "信誉仪表盘" },
  { path: "/network", name: "协作网络" },
  { path: "/discovery", name: "发现网络" },
];

export default function Footer() {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    pages.findIndex((p) => p.path === pathname),
  );
  const progress = ((currentIndex + 1) / pages.length) * 100;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-t border-metal-silver/10 bg-deep-space/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4 text-xs text-metal-silver/40">
        <span>© 2026 AgentVerse</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden gap-1.5 md:flex">
          {pages.map((page, i) => (
            <Link
              key={page.path}
              href={page.path}
              className={`h-2 w-2 rounded-full border transition-all ${
                i === currentIndex
                  ? "border-iron-red bg-iron-red shadow-[0_0_6px_rgba(230,46,46,0.6)]"
                  : i < currentIndex
                    ? "border-neon-orange bg-neon-orange"
                    : "border-metal-silver/20 bg-iron-gray"
              }`}
              title={page.name}
            />
          ))}
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-iron-gray/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-iron-red to-neon-orange transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-orbitron text-[10px] text-metal-silver/40">
          {currentIndex + 1}/{pages.length}
        </span>
      </div>

      <div className="hidden w-24 sm:block" />
    </footer>
  );
}
