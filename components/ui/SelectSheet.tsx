
import React, { useState } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface SelectSheetProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  title?: string;
}

export const SelectSheet: React.FC<SelectSheetProps> = ({ label, value, options, onChange, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold flex items-center justify-between group active:scale-[0.98] transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
        >
          <div className="flex items-center gap-2">
            {selectedOption?.icon && <selectedOption.icon size={16} className="text-emerald-500"/>}
            <span className="text-slate-900 dark:text-emerald-50">{selectedOption?.label || value}</span>
          </div>
          <ChevronDown size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors"/>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#062c26] w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom-10 duration-300">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-emerald-950 dark:text-emerald-50 ml-2">{title || `Select ${label}`}</span>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <X size={20}/>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] ${opt.value === value ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                {opt.icon && <opt.icon size={18} className={opt.value === value ? 'text-emerald-600' : 'text-slate-400'}/>}
                                <span className="font-bold text-sm">{opt.label}</span>
                            </div>
                            {opt.value === value && <Check size={18} strokeWidth={3}/>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </>
  );
};
