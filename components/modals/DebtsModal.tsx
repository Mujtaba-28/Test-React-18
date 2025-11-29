
import React, { useState } from 'react';
import { X, Plus, Trash2, TrendingDown, Percent, Wallet, ArrowRight, CheckCircle2, Edit2, Tag, CreditCard, Building } from 'lucide-react';
import { Debt } from '../../types';
import { calculateDebtPayoff, formatMoney, triggerHaptic } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';
import { SelectSheet } from '../ui/SelectSheet';

interface DebtsModalProps {
    onClose: () => void;
}

export const DebtsModal: React.FC<DebtsModalProps> = ({ onClose }) => {
    const { debts, addDebt, updateDebt, deleteDebt } = useFinance();
    const { currency } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [newDebt, setNewDebt] = useState<Partial<Debt>>({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, category: 'Loan' });
    
    const [extraPayment, setExtraPayment] = useState(0);
    const [strategy] = useState<'snowball' | 'avalanche'>('avalanche');

    const handleEdit = (debt: Debt) => {
        setNewDebt({ ...debt });
        setEditingId(debt.id);
        setIsAdding(true);
        setDeleteId(null);
    };

    const handleSave = () => {
        if (!newDebt.name || !newDebt.currentBalance) return;
        
        const debtData: Debt = {
            id: editingId || Date.now().toString(),
            name: newDebt.name,
            currentBalance: Number(newDebt.currentBalance),
            interestRate: Number(newDebt.interestRate),
            minimumPayment: Number(newDebt.minimumPayment),
            category: newDebt.category || 'Loan'
        };

        if (editingId) updateDebt(debtData);
        else addDebt(debtData);
        
        triggerHaptic(20);
        setIsAdding(false);
        setEditingId(null);
        setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, category: 'Loan' });
    };

    const handleDelete = (id: string) => {
        deleteDebt(id);
        triggerHaptic(50);
        setDeleteId(null);
    };

    const payoff = calculateDebtPayoff(debts, extraPayment, strategy);
    
    const maxMonths = payoff.baselineMonths || 1;
    const newPercent = (payoff.months / maxMonths) * 100;
    
    const yearsSaved = ((payoff.baselineMonths - payoff.months) / 12).toFixed(1);
    const interestSaved = payoff.baselineInterest - payoff.totalInterest;

    const debtCategories = [
        { value: 'Credit Card', label: 'Credit Card', icon: CreditCard },
        { value: 'Loan', label: 'Personal Loan', icon: Wallet },
        { value: 'Mortgage', label: 'Mortgage', icon: Building },
        { value: 'Other', label: 'Other Liability', icon: Tag },
    ];

    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col relative overflow-hidden">
                
                <ConfirmationModal 
                    isOpen={!!deleteId}
                    title="Delete Liability?"
                    message="Are you sure you want to remove this debt from your planner? This will affect your payoff strategy."
                    onConfirm={() => deleteId && handleDelete(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="opacity-60 text-emerald-900 dark:text-emerald-100" />
                    </button>
                    <span className="font-bold text-emerald-950 dark:text-emerald-50">Debt Free Planner</span>
                    <button 
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingId(null);
                            setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, category: 'Loan' });
                            setDeleteId(null);
                        }} 
                        aria-label="Add Debt" 
                        className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-100 transition-colors"
                    >
                        {isAdding ? <X size={20}/> : <Plus size={20}/>}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white dark:bg-[#0a3831] p-6 rounded-[2rem] mb-4 border border-emerald-100 dark:border-emerald-800/30 shrink-0 animate-in zoom-in-95 shadow-xl overflow-visible">
                        <h4 className="font-bold text-sm mb-4 text-emerald-900 dark:text-emerald-100">{editingId ? 'Edit Liability' : 'Add New Liability'}</h4>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
                                <input type="text" placeholder="e.g. Credit Card" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
                            </div>
                            
                            <SelectSheet 
                                label="Type" 
                                value={newDebt.category || 'Loan'} 
                                options={debtCategories} 
                                onChange={(val) => setNewDebt({...newDebt, category: val})} 
                            />

                            <div className="flex gap-4">
                                <div className="space-y-1 flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Balance</label>
                                    <input type="number" placeholder="0" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newDebt.currentBalance || ''} onChange={e => setNewDebt({...newDebt, currentBalance: parseFloat(e.target.value)})} />
                                </div>
                                <div className="space-y-1 w-24">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Interest %</label>
                                    <input type="number" placeholder="%" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newDebt.interestRate || ''} onChange={e => setNewDebt({...newDebt, interestRate: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Min Payment</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="0" className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newDebt.minimumPayment || ''} onChange={e => setNewDebt({...newDebt, minimumPayment: parseFloat(e.target.value)})} />
                                    <button onClick={handleSave} className="p-3 bg-emerald-600 text-white rounded-xl font-bold text-sm w-24 shadow-lg active:scale-95 transition-transform hover:bg-emerald-700">{editingId ? 'Update' : 'Save'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-[#0a3831] p-5 rounded-[2rem] mb-4 border border-emerald-100 dark:border-emerald-800/30 shrink-0 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-lg text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                                <TrendingDown size={20} className="text-emerald-600"/> Payoff Simulator
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">See how fast you can be debt-free.</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl mb-6">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">I can pay extra per month</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-slate-400">{currency}</span>
                            <input 
                                type="number" 
                                value={extraPayment || ''} 
                                onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-2xl font-bold text-emerald-900 dark:text-emerald-50 outline-none placeholder:text-slate-200"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-slate-400">Current Path</span>
                                <span className="text-slate-500">{(payoff.baselineMonths/12).toFixed(1)} Years</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> With Extra Payment</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{(payoff.months/12).toFixed(1)} Years</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-emerald-100/50 w-full"></div>
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700 relative" style={{ width: `${newPercent}%` }}>
                                    <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {extraPayment > 0 && (
                        <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-3">
                             <div className="p-1.5 bg-emerald-100 dark:bg-emerald-800/50 rounded-full text-emerald-600 dark:text-emerald-400 mt-0.5">
                                 <ArrowRight size={14}/>
                             </div>
                             <div>
                                 <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100 leading-relaxed">
                                     You will be debt-free <span className="text-emerald-600 dark:text-emerald-400">{yearsSaved} years earlier</span> and save <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(interestSaved, currency, false)}</span> in interest!
                                 </p>
                             </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-hide pb-2">
                    {debts.map((debt: Debt) => (
                        <div key={debt.id} className="bg-white dark:bg-[#0a3831] p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                    <Wallet size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-50">{debt.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                        <span className="flex items-center gap-0.5"><Tag size={10}/> {debt.category || 'Loan'}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5"><Percent size={10}/> {debt.interestRate}%</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-100 mr-2">{formatMoney(debt.currentBalance, currency, false)}</span>
                                
                                <button onClick={() => handleEdit(debt)} className="p-2 rounded-full hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => setDeleteId(debt.id)} aria-label="Delete" className="p-2 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {debts.length === 0 && (
                        <div className="text-center py-8 opacity-50">
                            <Wallet size={32} className="mx-auto mb-2 text-slate-300"/>
                            <p className="text-sm font-bold text-slate-400">No debts added yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
