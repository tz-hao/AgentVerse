interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-metal-silver/10">
      <span className="text-xs text-metal-silver/50">共 {total} 条</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current === 1}
          className="w-8 h-8 rounded-lg border border-metal-silver/20 flex items-center justify-center text-metal-silver/60 hover:text-white hover:border-iron-red disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <i className="fas fa-chevron-left text-xs" />
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-metal-silver/40 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                current === p
                  ? 'bg-iron-red text-white shadow-[0_0_10px_rgba(230,46,46,0.5)]'
                  : 'border border-metal-silver/20 text-metal-silver/60 hover:text-white hover:border-metal-silver'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(totalPages, current + 1))}
          disabled={current === totalPages}
          className="w-8 h-8 rounded-lg border border-metal-silver/20 flex items-center justify-center text-metal-silver/60 hover:text-white hover:border-iron-red disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <i className="fas fa-chevron-right text-xs" />
        </button>
      </div>
    </div>
  );
}
