'use client';

import { useModal } from '@/components/providers/AppProvider';

export default function ModalOverlay() {
  const { isOpen, title, content, closeModal } = useModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />
      {/* dialog */}
      <div className="relative bg-gradient-to-br from-iron-dark to-deep-space border border-metal-silver/50 rounded-2xl shadow-[0_0_40px_rgba(230,46,46,0.3)] max-w-lg w-full overflow-hidden animate-scale-in">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-metal-silver/20">
          <h3 className="font-bold font-orbitron text-lg text-white">{title}</h3>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full border border-metal-silver/30 flex items-center justify-center text-metal-silver hover:text-white hover:border-iron-red transition"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>
        {/* body */}
        <div className="px-6 py-5 text-metal-silver text-sm leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}
