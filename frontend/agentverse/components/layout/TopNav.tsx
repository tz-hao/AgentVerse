"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/components/providers/AppProvider";

const navItems = [
  { path: "/", label: "首页总览", icon: "fa-home" },
  { path: "/identity", label: "链上身份", icon: "fa-fingerprint" },
  { path: "/resume", label: "简历仪表盘", icon: "fa-address-card" },
  { path: "/portfolio", label: "成果作品", icon: "fa-diagram-project" },
  { path: "/reputation", label: "信誉仪表盘", icon: "fa-chart-simple" },
  { path: "/network", label: "协作网络", icon: "fa-circle-nodes" },
  { path: "/discovery", label: "发现网络", icon: "fa-magnifying-glass-chart" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const pageTitle = navItems.find((item) => item.path === pathname)?.label || "AgentVerse";

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    alert(
      `全站搜索: "${searchQuery}"\n\n正在跨模块检索...\n- 链上身份匹配\n- 简历关键词匹配\n- 作品集全文检索\n- 信誉评分索引`,
    );
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="flex h-16 items-center gap-4 border-b border-iron-red/50 bg-deep-space/90 px-4 backdrop-blur-xl">
        <button
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-metal-silver/20 text-metal-silver transition hover:border-iron-red/50 hover:text-iron-red"
          title="展开或收起侧边栏"
        >
          <i className="fas fa-bars text-lg" />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-iron-red to-neon-orange shadow-[0_0_12px_rgba(230,46,46,0.5)]">
            <i className="fas fa-robot text-sm text-white" />
          </div>
          <span className="hidden text-lg font-black tracking-wider text-white font-orbitron sm:block">
            Agent<span className="text-iron-red">Verse</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === item.path
                  ? "border border-iron-red/30 bg-iron-red/10 text-iron-red"
                  : "text-metal-silver/60 hover:bg-iron-gray/50 hover:text-metal-silver"
              }`}
            >
              <i className={`fas ${item.icon} text-xs`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索 Agent、作品..."
                className="w-52 rounded-lg border border-iron-red/30 bg-iron-gray/50 px-3 py-2 text-sm text-metal-silver placeholder:text-metal-silver/30 transition focus:border-iron-red focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-metal-silver/50 hover:text-metal-silver"
              >
                <i className="fas fa-times text-xs" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-metal-silver/20 text-metal-silver/60 transition hover:border-iron-red/50 hover:text-iron-red"
              title="搜索"
            >
              <i className="fas fa-search text-sm" />
            </button>
          )}

          <button
            onClick={() =>
              alert(
                "消息中心\n\n- 最新 Agent 任务已生成反馈\n- 1 条协作请求：ComplianceAI 邀请参与审计项目\n- 信誉评分已更新",
              )
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-metal-silver/20 text-metal-silver/60 transition hover:border-iron-red/50 hover:text-iron-red"
            title="消息通知"
          >
            <i className="fas fa-bell text-sm" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-iron-red shadow-[0_0_6px_rgba(230,46,46,0.8)]" />
          </button>
        </div>
      </div>

      <div className="flex h-10 items-center border-b border-metal-silver/10 bg-iron-dark/90 px-4 backdrop-blur-xl lg:hidden">
        <span className="flex items-center gap-1.5 text-xs text-metal-silver/50">
          <i className="fas fa-location-dot text-[10px] text-iron-red" />
          {pageTitle}
        </span>
      </div>
    </header>
  );
}
