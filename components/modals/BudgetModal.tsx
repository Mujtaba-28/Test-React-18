
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, PieChart, Wallet } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../constants';
import { useFinance } from '../../contexts/FinanceContext';
import { triggerHaptic } from '../../utils';

interface BudgetModalProps {
  currentBudget: number;
  onSave: (amount: number, monthKey: string, category?: string) => void;
  onClose: () => void;
  currency: string;
  currentDate: Date;
  changeBudgetMonth: (offset: number) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ currentBudget, onSave, onClose, currency, currentDate, changeBudgetMonth }) => {
    const { budgets } = useFinance();
    const [amount, setAmount] = useState(currentBudget);
    const [activeTab, setActiveTab] = useState<'total' | 'category'>('total');
    
    const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});

    const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    useEffect(() => {
        const initialLimits: Record<string, string> = {};
        EXPENSE_CATEGORIES.forEach(cat => {
            const val = budgets[`${monthKey}-category-${cat.name}`];
            initialLimits[cat.name] = val ? val.toString() : '';
        });
        setCategoryLimits(initialLimits);
        setAmount(currentBudget);
    }, [monthKey, budgets, currentBudget]);

    const handleCategoryChange = (catName: string, value: string) => {
        setCategoryLimits(prev => ({ ...prev, [catName]: value }));
    };

    const saveAllCategories = () => {
        Object.entries(categoryLimits).forEach(([catName, val]) => {
            const numVal = parseFloat(String(val));
            if (!isNaN(numVal)) {
                onSave(numVal, monthKey, catName);
            } else if (val === '') {
                onSave(0, monthKey, catName);
            }
        });
        triggerHaptic(20);
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-emerald-950 dark:text-emerald-50">Budget Settings</h3>
                    <button onClick={onClose} aria-label="Close Budget Modal" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24} className="opacity-60 text-emerald-900 dark:text-emerald-100"/></button>
                </div>

                <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#0a3831] p-2 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                    <button onClick={() => changeBudgetMonth(-1)} aria-label="Previous Month" className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-900 dark:text-emerald-100"><ChevronLeft size={20}/></button>
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-widest">{currentMonthName}</span>
                    <button onClick={() => changeBudgetMonth(1)} aria-label="Next Month" className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-900 dark:text-emerald-100"><ChevronRight size={20}/></button>
                </div>

                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-2xl mb-6">
                    <button 
                        onClick={() => setActiveTab('total')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'total' ? 'bg-white dark:bg-[#0a3831] text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        <Wallet size={16}/> Total Limit
                    </button>
                    <button 
                        onClick={() => setActiveTab('category')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'category' ? 'bg-white dark:bg-[#0a3831] text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        <PieChart size={16}/> Category Limits
                    </button>
                </div>
                
                {activeTab === 'total' ? (
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <div className="flex flex-col items-center justify-center mb-8">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Maximum Spending</label>
                            <div className="flex items-center gap-2">
                                <span className="text-4xl font-bold text-emerald-900/30 dark:text-emerald-100/30">{currency}</span>
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    className="bg-transparent text-5xl font-black text-emerald-900 dark:text-emerald-50 outline-none text-center w-48"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mb-8">
                            <button onClick={() => setAmount(prev => Math.round(prev * 1.05))} className="flex-1 py-3 bg-white dark:bg-[#0a3831] rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs active:scale-95 transition-transform">+5%</button>
                            <button onClick={() => setAmount(prev => Math.round(prev * 1.10))} className="flex-1 py-3 bg-white dark:bg-[#0a3831] rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs active:scale-95 transition-transform">+10%</button>
                            <button onClick={() => setAmount(prev => Math.round(prev * 0.95))} className="flex-1 py-3 bg-white dark:bg-[#0a3831] rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs active:scale-95 transition-transform">-5%</button>
                        </div>

                        <button 
                            onClick={() => onSave(amount, monthKey)} 
                            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20}/> Save Total Limit
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 overflow-hidden">
                        <p className="text-center text-xs text-slate-400 mb-2 shrink-0">Set individual caps for better control.</p>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide pb-20">
                            {EXPENSE_CATEGORIES.map(cat => {
                                const currentVal = categoryLimits[cat.name] || '';
                                
                                return (
                                    <div key={cat.id} className="bg-white dark:bg-[#0a3831] p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                                            <cat.icon size={18}/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-emerald-950 dark:text-emerald-50">{cat.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-bold text-xs">{currency}</span>
                                            <input 
                                                type="number"
                                                placeholder="0"
                                                value={currentVal}
                                                onChange={(e) => handleCategoryChange(cat.name, e.target.value)}
                                                className="w-24 p-2 rounded-lg bg-slate-50 dark:bg-black/20 outline-none font-bold text-sm text-right focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                             <button 
                                onClick={saveAllCategories} 
                                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20}/> Save Category Limits
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};
