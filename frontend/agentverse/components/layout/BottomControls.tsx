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

export default function BottomControls() {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    pages.findIndex((p) => p.path === pathname),
  );
  const prevPage = pages[currentIndex - 1];
  const nextPage = pages[currentIndex + 1];
  const progress = ((currentIndex + 1) / pages.length) * 100;

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-between border-t border-iron-red bg-deep-space/95 px-8 backdrop-blur-md">
      <Link
        href={prevPage?.path || "#"}
        className={`nav-btn ${!prevPage ? "pointer-events-none cursor-not-allowed opacity-30" : ""}`}
        title={prevPage?.name ?? "上一页"}
      >
        <i className="fas fa-chevron-left" />
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {pages.map((page, index) => (
            <Link
              key={page.path}
              href={page.path}
              title={page.name}
              className={`h-2.5 w-2.5 rounded-full border border-metal-silver transition-all ${
                index === currentIndex ? "bg-iron-red shadow-[0_0_8px_rgba(230,46,46,0.6)]" : "bg-iron-gray"
              }`}
            />
          ))}
        </div>
        <div className="h-1 w-48 overflow-hidden rounded bg-iron-gray">
          <div
            className="h-full bg-gradient-to-r from-iron-red to-neon-orange transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link
        href={nextPage?.path || "#"}
        className={`nav-btn ${!nextPage ? "pointer-events-none cursor-not-allowed opacity-30" : ""}`}
        title={nextPage?.name ?? "下一页"}
      >
        <i className="fas fa-chevron-right" />
      </Link>
    </div>
  );
}
