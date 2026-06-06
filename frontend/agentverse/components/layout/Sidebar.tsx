"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/providers/AppProvider";

const menuItems = [
  { path: "/", label: "首页总览", icon: "fa-home", color: "text-sky-400" },
  { path: "/identity", label: "链上身份", icon: "fa-fingerprint", color: "text-emerald-400" },
  { path: "/resume", label: "简历仪表盘", icon: "fa-address-card", color: "text-violet-400" },
  { path: "/portfolio", label: "成果作品", icon: "fa-diagram-project", color: "text-amber-400" },
  { path: "/reputation", label: "信誉仪表盘", icon: "fa-chart-simple", color: "text-rose-400" },
  { path: "/network", label: "协作网络", icon: "fa-circle-nodes", color: "text-cyan-400" },
  { path: "/discovery", label: "发现网络", icon: "fa-magnifying-glass-chart", color: "text-fuchsia-400" },
];

const quickActions = [
  { label: "刷新数据", icon: "fa-arrows-rotate", action: () => window.location.reload() },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`
        fixed left-0 z-40 h-full
        border-r border-metal-silver/10 bg-deep-space/95 backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-[220px]"}
      `}
      style={{ top: "64px", paddingBottom: "64px" }}
    >
      <nav className="flex h-full flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {menuItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "border border-iron-red/30 bg-iron-red/10 text-white shadow-[0_0_12px_rgba(230,46,46,0.15)]"
                    : "border border-transparent text-metal-silver/50 hover:bg-iron-gray/40 hover:text-white"
                }
              `}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  active ? "bg-iron-red/20" : "bg-iron-gray/30 group-hover:bg-iron-gray/50"
                }`}
              >
                <i className={`fas ${item.icon} text-sm ${active ? "text-iron-red" : item.color}`} />
              </div>
              <span
                className={`whitespace-nowrap transition-opacity duration-200 ${
                  collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100"
                }`}
              >
                {item.label}
              </span>
              {active && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-iron-red shadow-[0_0_6px_rgba(230,46,46,0.8)]" />
              )}
            </Link>
          );
        })}

        <div className="my-3 border-t border-metal-silver/10" />

        {!collapsed && (
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-metal-silver/30">
            快捷操作
          </p>
        )}

        {quickActions.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-metal-silver/40 transition hover:bg-iron-gray/40 hover:text-white"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-iron-gray/30">
              <i className={`fas ${item.icon} text-xs`} />
            </div>
            <span
              className={`whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
