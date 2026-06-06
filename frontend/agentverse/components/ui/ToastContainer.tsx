'use client';

import { useToast } from '@/components/providers/AppProvider';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  const iconMap: Record<string, string> = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  const borderMap: Record<string, string> = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-400',
  };

  const bgMap: Record<string, string> = {
    success: 'bg-green-500/10',
    error: 'bg-red-500/10',
    warning: 'bg-yellow-500/10',
    info: 'bg-blue-400/10',
  };

  return (
    <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto animate-slide-in-right
            backdrop-blur-xl border rounded-xl px-5 py-4 min-w-[320px] max-w-[420px]
            shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-start gap-3
            ${borderMap[t.type]} ${bgMap[t.type]}
          `}
        >
          <i className={`fas ${iconMap[t.type]} text-lg mt-0.5 ${
            t.type === 'success' ? 'text-green-400' :
            t.type === 'error' ? 'text-red-400' :
            t.type === 'warning' ? 'text-yellow-400' :
            'text-blue-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">{t.title}</p>
            {t.message && <p className="text-metal-silver/70 text-xs mt-1">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-metal-silver/50 hover:text-white transition">
            <i className="fas fa-times text-sm" />
          </button>
        </div>
      ))}
    </div>
  );
}
