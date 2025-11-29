import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Delete' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[150] flex items-center justify-center bg-emerald-950/40 backdrop-blur-md p-6 animate-in fade-in duration-200 rounded-[2.5rem]">
      <div className="w-full max-w-xs bg-white dark:bg-[#062c26] rounded-3xl p-6 shadow-2xl border border-rose-100 dark:border-rose-900/30 scale-100 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4 mx-auto text-rose-500 shadow-sm">
            <AlertTriangle size={28} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 leading-relaxed">
            {message}
        </p>
        <div className="flex flex-col gap-3">
            <button 
                onClick={onConfirm} 
                className="w-full py-3.5 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all active:scale-[0.98] text-sm"
            >
                {confirmText}
            </button>
            <button 
                onClick={onCancel} 
                className="w-full py-3.5 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};