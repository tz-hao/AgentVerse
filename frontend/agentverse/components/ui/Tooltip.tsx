'use client';

import { useState, type ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  const posClass: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClass: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-iron-gray',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-iron-gray',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-iron-gray',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-iron-gray',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`absolute z-[9997] ${posClass[position]}`}>
          <div className="bg-iron-gray border border-metal-silver/40 text-metal-silver text-xs rounded-lg px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.5)] whitespace-nowrap max-w-[240px]">
            {text}
          </div>
          <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClass[position]}`} />
        </div>
      )}
    </div>
  );
}
