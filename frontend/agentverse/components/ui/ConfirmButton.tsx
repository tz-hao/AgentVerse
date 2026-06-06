'use client';

import { useState } from 'react';
import MechaButton from './MechaButton';

interface ConfirmButtonProps {
  children: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  className?: string;
  variant?: 'danger' | 'default';
}

export default function ConfirmButton({
  children,
  onConfirm,
  confirmText = '确认执行此操作？',
  className = '',
  variant = 'default',
}: ConfirmButtonProps) {
  const [step, setStep] = useState<'idle' | 'confirming'>('idle');

  if (step === 'confirming') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-xs text-metal-silver/70">{confirmText}</span>
        <button
          onClick={() => { onConfirm(); setStep('idle'); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition ${
            variant === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-iron-red hover:bg-red-700'
          }`}
        >
          <i className="fas fa-check mr-1" /> 确认
        </button>
        <button
          onClick={() => setStep('idle')}
          className="px-3 py-1.5 rounded-lg border border-metal-silver/30 text-metal-silver/60 text-xs hover:text-white transition"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => setStep('confirming')} className={className}>
      <MechaButton>
        {children}
      </MechaButton>
    </div>
  );
}
