'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/* ── Toast ── */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Sidebar ── */
interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

/* ── Modal ── */
interface ModalContextValue {
  isOpen: boolean;
  title: string;
  content: ReactNode;
  openModal: (title: string, content: ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue>({
  isOpen: false,
  title: '',
  content: null,
  openModal: () => {},
  closeModal: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

/* ── Provider ── */
let toastId = 0;

export default function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ReactNode>(null);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggle = useCallback(() => setCollapsed((p) => !p), []);

  const openModal = useCallback((t: string, c: ReactNode) => {
    setTitle(t);
    setContent(c);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <SidebarContext.Provider value={{ collapsed, toggle }}>
        <ModalContext.Provider value={{ isOpen, title, content, openModal, closeModal }}>
          {children}
        </ModalContext.Provider>
      </SidebarContext.Provider>
    </ToastContext.Provider>
  );
}
