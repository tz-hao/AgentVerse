export default function LoadingSpinner({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-iron-gray" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-iron-red animate-spin" />
      </div>
      <p className="text-sm text-metal-silver/60">{text}</p>
    </div>
  );
}
