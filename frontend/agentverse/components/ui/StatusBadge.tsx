interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'verified' | 'warning' | 'error';
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active:   { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', dot: 'bg-green-400', label: '活跃中' },
  inactive: { bg: 'bg-metal-silver/10 border-metal-silver/20', text: 'text-metal-silver/50', dot: 'bg-metal-silver/40', label: '非活跃' },
  pending:  { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400', label: '待确认' },
  verified: { bg: 'bg-blue-400/10 border-blue-400/30', text: 'text-blue-400', dot: 'bg-blue-400', label: '已验证' },
  warning:  { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400', label: '警告' },
  error:    { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400', label: '异常' },
};

export default function StatusBadge({ status, label, pulse = false }: StatusBadgeProps) {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {label || c.label}
    </span>
  );
}
