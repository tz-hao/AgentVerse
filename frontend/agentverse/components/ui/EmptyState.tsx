interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = 'fa-inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-iron-gray/50 border border-metal-silver/20 flex items-center justify-center mb-5">
        <i className={`fas ${icon} text-3xl text-metal-silver/40`} />
      </div>
      <h4 className="text-lg font-semibold text-metal-silver/70 mb-2">{title}</h4>
      {description && <p className="text-sm text-metal-silver/50 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
