'use client';

import { useEffect, useRef } from 'react';
import PrintButton from './PrintButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  printTitle?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  printTitle,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <>
      <style>{`
        @media print {
          .modal-backdrop {
            position: static !important;
            background: none !important;
            backdrop-filter: none !important;
            overflow: visible !important;
          }
          .modal-card {
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .modal-close-btn {
            display: none !important;
          }
        }
      `}</style>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div className="modal-card bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
            <div>
              {printTitle && (
                <p className="hidden print:block text-xs text-gray-400 mb-1">{printTitle}</p>
              )}
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <PrintButton />
              <button
                onClick={onClose}
                className="modal-close-btn w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
