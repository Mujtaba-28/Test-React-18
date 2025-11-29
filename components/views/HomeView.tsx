
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit2, Wallet, Target, ArrowDownLeft, ArrowUpRight, ArrowRight, ShieldAlert, DownloadCloud, X, Zap, Check } from 'lucide-react';
import { Transaction, Subscription } from '../../types';
import { TransactionItem } from '../TransactionItem';
import { formatMoney, triggerHaptic, calculateNextDate } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HomeViewProps {
  currentDate: Date;
  changeMonth: (offset: number) => void;
  onEditBudget: () => void;
  onEditTx: (tx: Transaction) => void;
  onViewHistory: () => void;
  isPrivacyMode: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  currentDate, changeMonth, onEditBudget, onEditTx, 
  onViewHistory, isPrivacyMode 
}) => {
    const { transactions, createBackup, lastBackupDate, subscriptions, updateSubscription, addTransaction, activeContext, budgets } = useFinance();
    const { currency } = useTheme();
    const [filterType, setFilterType] = useState('all');
    const [showBackupAlert, setShowBackupAlert] = useState(false);

    const currentMonthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    const budgetKey = `${activeContext}-${currentMonthKey}`;
    const defaultBudgetKey = `${activeContext}-default`;
    const totalBudget = budgets[budgetKey] || budgets[defaultBudgetKey] || 0;

    useEffect(() => {
        if (transactions.length > 5) {
            if (!lastBackupDate) setShowBackupAlert(true);
            else {
                const diff = new Date().getTime() - new Date(lastBackupDate).getTime();
                if (diff / (1000 * 3600 * 24) > 7) setShowBackupAlert(true);
            }
        }
    }, [transactions.length, lastBackupDate]);
    
    const dueSubscription = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = subscriptions.filter((sub: Subscription) => {
            const nextDate = new Date(sub.nextBillingDate);
            nextDate.setHours(0,0,0,0);
            const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
        }).sort((a: Subscription, b: Subscription) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
        return due.length > 0 ? due[0] : null;
    }, [subscriptions]);

    const handlePaySubscription = async () => {
        if (!dueSubscription) return;
        await addTransaction({
            id: Date.now(),
            title: dueSubscription.name,
            amount: dueSubscription.amount,
            category: dueSubscription.category || 'Bills',
            date: new Date().toISOString(),
            type: 'expense'
        });
        const newNextDate = calculateNextDate(dueSubscription.nextBillingDate, dueSubscription.billingCycle);
        updateSubscription({ ...dueSubscription, nextBillingDate: newNextDate });
        triggerHaptic(20);
    };

    const monthlyTransactions = useMemo(() => {
        return transactions.filter((t: Transaction) => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
        });
    }, [transactions, currentDate]);

    const totalIncome = monthlyTransactions.filter((t: Transaction) => t.type === 'income').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
    const totalExpense = monthlyTransactions.filter((t: Transaction) => t.type === 'expense').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
    const remainingBudget = totalBudget - totalExpense;
    const budgetProgress = totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0;

    const displayTransactions = (filterType === 'all' ? monthlyTransactions : monthlyTransactions.filter((t: Transaction) => t.type === filterType))
      .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const handleFilterClick = (type: string) => {
        triggerHaptic(5);
        setFilterType(prev => prev === type ? 'all' : type);
    };

    const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 max-w-md mx-auto">
            
            {dueSubscription && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-700/30 rounded-3xl animate-in slide-in-from-top-4 duration-500 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Zap size={80} className="text-indigo-500"/>
                     </div>
                     <div className="flex items-start gap-4 relative z-10">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                             <Zap size={24}/>
                         </div>
                         <div className="flex-1">
                             <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Upcoming Bill</h4>
                             <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 mb-3">
                                 <span className="font-bold">{dueSubscription.name}</span> is due soon ({formatMoney(dueSubscription.amount, currency, isPrivacyMode)}).
                             </p>
                             <button 
                                onClick={handlePaySubscription}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-transform flex items-center gap-2"
                             >
                                 Pay Now <Check size={14}/>
                             </button>
                         </div>
                     </div>
                </div>
            )}

            {showBackupAlert && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-3xl animate-in slide-in-from-top-4 duration-500 shadow-sm">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">Data Safety Check</h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 mb-3">You haven't backed up your data in a while. Create a backup to ensure your financial history is safe.</p>
                            <button 
                                onClick={() => { createBackup(); setShowBackupAlert(false); }}
                                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-transform flex items-center gap-2"
                            >
                                <DownloadCloud size={14}/> Backup Now
                            </button>
                        </div>
                        <button onClick={() => setShowBackupAlert(false)} className="text-amber-400 hover:text-amber-600"><X size={16}/></button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#0a3831] p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                             <Wallet size={12}/> {activeContext} Budget
                         </p>
                         <h2 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">{formatMoney(remainingBudget, currency, isPrivacyMode)}</h2>
                         <p className="text-xs font-bold text-slate-400 mt-1">Left of {formatMoney(totalBudget, currency, isPrivacyMode)}</p>
                    </div>
                    <button onClick={onEditBudget} className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                        <Edit2 size={20} />
                    </button>
                </div>

                <div className="relative h-4 bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden mb-6">
                    <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${budgetProgress > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => handleFilterClick('income')} className={`p-4 rounded-2xl transition-colors cursor-pointer border ${filterType === 'income' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700' : 'bg-slate-50 dark:bg-black/20 border-transparent'}`}>
                        <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                            <div className="p-1.5 bg-white dark:bg-emerald-900/50 rounded-full"><ArrowDownLeft size={14} strokeWidth={3}/></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Income</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-900 dark:text-emerald-50">{formatMoney(totalIncome, currency, isPrivacyMode)}</p>
                    </div>
                    <div onClick={() => handleFilterClick('expense')} className={`p-4 rounded-2xl transition-colors cursor-pointer border ${filterType === 'expense' ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-700' : 'bg-slate-50 dark:bg-black/20 border-transparent'}`}>
                        <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                            <div className="p-1.5 bg-white dark:bg-rose-900/50 rounded-full"><ArrowUpRight size={14} strokeWidth={3}/></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Expense</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-900 dark:text-emerald-50">{formatMoney(totalExpense, currency, isPrivacyMode)}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-between px-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white dark:hover:bg-[#0a3831] text-slate-400 transition-colors"><ChevronLeft size={24}/></button>
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-50 font-bold bg-white dark:bg-[#0a3831] px-4 py-2 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                    <CalendarIcon size={16} className="text-emerald-500"/>
                    <span>{currentMonthName}</span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white dark:hover:bg-[#0a3831] text-slate-400 transition-colors"><ChevronRight size={24}/></button>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-emerald-950 dark:text-emerald-50 text-lg">Recent Activity</h3>
                    <button onClick={onViewHistory} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1">
                        View All <ArrowRight size={14}/>
                    </button>
                </div>
                <div className="space-y-3">
                    {displayTransactions.length > 0 ? (
                        displayTransactions.map((tx: Transaction) => (
                            <TransactionItem 
                                key={tx.id} 
                                tx={tx} 
                                onClick={onEditTx} 
                                currency={currency}
                                isPrivacyMode={isPrivacyMode}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <Target size={40} className="text-emerald-200 dark:text-emerald-900 mb-2"/>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">No transactions found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
