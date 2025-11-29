
import React, { useState } from 'react';
import { X, Plus, Calendar, Trash2, Zap, LayoutGrid, List, Edit2, Repeat } from 'lucide-react';
import { Subscription } from '../../types';
import { EXPENSE_CATEGORIES } from '../../constants';
import { formatMoney, triggerHaptic } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';
import { SelectSheet } from '../ui/SelectSheet';

interface SubscriptionsModalProps {
    onClose: () => void;
}

export const SubscriptionsModal: React.FC<SubscriptionsModalProps> = ({ onClose }) => {
    const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useFinance();
    const { currency } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const [newSub, setNewSub] = useState<Partial<Subscription>>({
        name: '', amount: 0, category: 'Bills', billingCycle: 'monthly', nextBillingDate: new Date().toISOString().split('T')[0], autoPay: false
    });

    const handleEdit = (sub: Subscription) => {
        setNewSub({ ...sub });
        setEditingId(sub.id);
        setIsAdding(true);
        setViewMode('list');
        setDeleteId(null);
    };

    const handleSave = () => {
        if (!newSub.name || !newSub.amount) return;
        
        const subData: Subscription = {
            id: editingId || Date.now().toString(),
            name: newSub.name,
            amount: Number(newSub.amount),
            billingCycle: newSub.billingCycle as any || 'monthly',
            nextBillingDate: newSub.nextBillingDate || new Date().toISOString(),
            category: newSub.category || 'Bills',
            autoPay: newSub.autoPay
        };

        if (editingId) updateSubscription(subData);
        else addSubscription(subData);
        
        triggerHaptic(20);
        setIsAdding(false);
        setEditingId(null);
        setNewSub({ name: '', amount: 0, category: 'Bills', billingCycle: 'monthly', nextBillingDate: new Date().toISOString().split('T')[0], autoPay: false });
    };

    const handleDelete = (id: string) => {
        deleteSubscription(id);
        triggerHaptic(50);
        setDeleteId(null);
    };

    const calculateMonthlyCost = (amount: number, cycle: string) => {
        switch(cycle) {
            case 'daily': return amount * 30;
            case 'weekly': return amount * 4.33;
            case 'monthly': return amount;
            case 'quarterly': return amount / 3;
            case 'half-yearly': return amount / 6;
            case 'yearly': return amount / 12;
            default: return amount;
        }
    };

    const totalMonthly = subscriptions.reduce((acc: number, sub: Subscription) => acc + calculateMonthlyCost(sub.amount, sub.billingCycle), 0);

    const cycleOptions = [
        { value: 'daily', label: 'Daily', icon: Repeat },
        { value: 'weekly', label: 'Weekly', icon: Repeat },
        { value: 'monthly', label: 'Monthly', icon: Repeat },
        { value: 'quarterly', label: 'Quarterly', icon: Repeat },
        { value: 'half-yearly', label: 'Half Yearly', icon: Repeat },
        { value: 'yearly', label: 'Yearly', icon: Repeat },
    ];

    const categoryOptions = EXPENSE_CATEGORIES.map(c => ({
        value: c.name,
        label: c.name,
        icon: c.icon
    }));

    const generateCalendarDays = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col relative overflow-hidden">
                
                <ConfirmationModal 
                    isOpen={!!deleteId}
                    title="Delete Subscription?"
                    message="Are you sure you want to delete this subscription? This will stop future reminders."
                    onConfirm={() => deleteId && handleDelete(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="opacity-60 text-emerald-900 dark:text-emerald-100" />
                    </button>
                    <div className="flex bg-white dark:bg-[#0a3831] p-1 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}><List size={18}/></button>
                        <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}><LayoutGrid size={18}/></button>
                    </div>
                    <button 
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingId(null);
                            setNewSub({ name: '', amount: 0, category: 'Bills', billingCycle: 'monthly', nextBillingDate: new Date().toISOString().split('T')[0], autoPay: false });
                            setDeleteId(null);
                        }} 
                        aria-label="Add Subscription" 
                        className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-100"
                    >
                        {isAdding ? <X size={20}/> : <Plus size={20}/>}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl mb-4 border border-emerald-100 dark:border-emerald-800/30 shrink-0 animate-in zoom-in-95 overflow-visible">
                        <h4 className="font-bold text-sm mb-3 text-emerald-900 dark:text-emerald-100">{editingId ? 'Edit Subscription' : 'Add Recurring Bill'}</h4>
                        <div className="space-y-3">
                            <input type="text" placeholder="Service Name (e.g. Netflix)" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
                            
                            <div className="flex gap-2">
                                <input type="number" placeholder="Amount" className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newSub.amount || ''} onChange={e => setNewSub({...newSub, amount: parseFloat(e.target.value)})} />
                                <div className="flex-1">
                                    <SelectSheet 
                                        label="Cycle" 
                                        value={newSub.billingCycle || 'monthly'} 
                                        options={cycleOptions} 
                                        onChange={(val) => setNewSub({...newSub, billingCycle: val as any})} 
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <SelectSheet 
                                        label="Category" 
                                        value={newSub.category || 'Bills'} 
                                        options={categoryOptions} 
                                        onChange={(val) => setNewSub({...newSub, category: val})} 
                                    />
                                </div>
                            </div>
                            
                            <div 
                                onClick={() => setNewSub({...newSub, autoPay: !newSub.autoPay})}
                                className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${newSub.autoPay ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-transparent dark:bg-black/20'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Zap size={18} className={newSub.autoPay ? 'text-indigo-600' : 'text-slate-400'} fill={newSub.autoPay ? 'currentColor' : 'none'}/>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${newSub.autoPay ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-500'}`}>Auto-Create Transaction</span>
                                        <span className="text-[10px] text-slate-400">Add to expenses automatically on due date</span>
                                    </div>
                                </div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${newSub.autoPay ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${newSub.autoPay ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center pt-2">
                                <input type="date" className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-black/20 outline-none text-sm font-bold border border-transparent focus:border-emerald-500 transition-all" value={newSub.nextBillingDate} onChange={e => setNewSub({...newSub, nextBillingDate: e.target.value})} />
                                <button onClick={handleSave} className="p-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex-1 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">{editingId ? 'Update' : 'Save'}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-emerald-500 text-white p-5 rounded-3xl mb-4 flex justify-between items-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <div>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Monthly Fixed Cost</p>
                        <h3 className="text-2xl font-black">{formatMoney(totalMonthly, currency, false)}</h3>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Zap size={20} className="text-white"/>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                        {subscriptions.map((sub: Subscription) => {
                            const daysLeft = Math.ceil((new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const isDueSoon = daysLeft >= 0 && daysLeft <= 5;
                            
                            return (
                                <div key={sub.id} className="bg-white dark:bg-[#0a3831] p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-50 flex items-center gap-1">
                                                {sub.name}
                                                {sub.autoPay && <Zap size={12} className="text-indigo-500" fill="currentColor"/>}
                                            </h4>
                                            <p className={`text-[10px] font-bold ${isDueSoon ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {daysLeft < 0 ? 'Overdue' : `Due in ${daysLeft} days`} • <span className="capitalize">{sub.billingCycle}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-emerald-900 dark:text-emerald-100 mr-2">{formatMoney(sub.amount, currency, false)}</span>
                                        <button onClick={() => handleEdit(sub)} className="p-2 rounded-full hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors"><Edit2 size={16}/></button>
                                        <button onClick={() => setDeleteId(sub.id)} aria-label="Delete" className="p-2 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                        {subscriptions.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No active subscriptions.</p>}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                             {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-xs font-bold text-slate-400">{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, i) => {
                                if (!day) return <div key={i} className="aspect-square"></div>;
                                
                                const billsOnDay = subscriptions.filter((s: Subscription) => new Date(s.nextBillingDate).getDate() === day);
                                const hasBill = billsOnDay.length > 0;
                                const isToday = day === new Date().getDate();

                                return (
                                    <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border ${isToday ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <span className={`text-xs font-bold ${isToday ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>{day}</span>
                                        {hasBill && (
                                            <div className="flex -space-x-1 mt-1">
                                                {billsOnDay.map((bill: Subscription) => (
                                                    <div key={bill.id} className={`w-1.5 h-1.5 rounded-full ring-1 ring-white ${bill.autoPay ? 'bg-indigo-500' : 'bg-rose-500'}`} title={`${bill.name}`}></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 space-y-2">
                             <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">Upcoming this month</h5>
                             {subscriptions.sort((a: Subscription, b: Subscription) => new Date(a.nextBillingDate).getDate() - new Date(b.nextBillingDate).getDate()).map((sub: Subscription) => (
                                 <div key={sub.id} className="flex justify-between text-xs font-medium text-slate-500">
                                     <span className="flex items-center gap-1">
                                         {new Date(sub.nextBillingDate).getDate()}th - {sub.name}
                                         {sub.autoPay && <Zap size={10} className="text-indigo-500" fill="currentColor"/>}
                                     </span>
                                     <span>{formatMoney(sub.amount, currency, false)}</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
