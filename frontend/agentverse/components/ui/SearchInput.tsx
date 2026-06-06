'use client';

import { useState } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export default function SearchInput({ placeholder = '搜索...', onSearch, className = '' }: SearchInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-deep-space/80 border border-metal-silver/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-metal-silver placeholder:text-metal-silver/30 focus:border-iron-red focus:outline-none transition"
      />
      <button type="submit" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-metal-silver/40 hover:text-iron-red transition">
        <i className="fas fa-search text-sm" />
      </button>
      {value && (
        <button
          type="button"
          onClick={() => { setValue(''); onSearch(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-metal-silver/40 hover:text-metal-silver transition"
        >
          <i className="fas fa-times text-xs" />
        </button>
      )}
    </form>
  );
}
