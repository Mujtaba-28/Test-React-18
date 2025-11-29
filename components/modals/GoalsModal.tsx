
import React, { useState } from 'react';
import { X, Plus, Target, Trash2, Shield, Plane, Laptop, Home, Gift, Car, GraduationCap, Heart, Coins, ChevronRight, Edit2, Save } from 'lucide-react';
import { Goal } from '../../types';
import { formatMoney, triggerHaptic } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';

interface GoalsModalProps {
    onClose: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ onClose }) => {
    const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
    const { currency } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({ name: '', targetAmount: 0, currentAmount: 0, color: 'bg-emerald-500', icon: 'shield' });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const [activeGoalInput, setActiveGoalInput] = useState<string | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    const icons = [
        { id: 'shield', icon: Shield },
        { id: 'plane', icon: Plane },
        { id: 'laptop', icon: Laptop },
        { id: 'car', icon: Car },
        { id: 'home', icon: Home },
        { id: 'gift', icon: Gift },
        { id: 'edu', icon: GraduationCap },
        { id: 'health', icon: Heart },
        { id: 'save', icon: Coins },
    ];

    const colors = [
        'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 
        'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
        'bg-rose-500', 'bg-orange-500', 'bg-amber-500'
    ];

    const handleEdit = (goal: Goal) => {
        setNewGoal({ ...goal });
        setEditingId(goal.id);
        setIsAdding(true);
        setDeleteId(null);
    };

    const handleSave = () => {
        if (!newGoal.name || !newGoal.targetAmount) return;
        
        const goalData: Goal = {
            id: editingId || Date.now().toString(),
            name: newGoal.name,
            targetAmount: Number(newGoal.targetAmount),
            currentAmount: Number(newGoal.currentAmount || 0),
            color: newGoal.color || 'bg-emerald-500',
            icon: newGoal.icon || 'shield'
        };

        if (editingId) updateGoal(goalData);
        else addGoal(goalData);
        
        triggerHaptic(20);
        setIsAdding(false);
        setEditingId(null);
        setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, color: 'bg-emerald-500', icon: 'shield' });
    };

    const handleDelete = (id: string) => {
        deleteGoal(id);
        triggerHaptic(50);
        setDeleteId(null);
    };

    const handleUpdateProgress = (goal: Goal, amount: number) => {
        updateGoal({ ...goal, currentAmount: Math.max(0, goal.currentAmount + amount) });
        triggerHaptic(10);
        setActiveGoalInput(null);
        setCustomAmount('');
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col relative overflow-hidden">
                
                <ConfirmationModal 
                    isOpen={!!deleteId}
                    title="Delete Goal?"
                    message="Are you sure you want to remove this savings goal? Your progress will be lost."
                    onConfirm={() => deleteId && handleDelete(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="opacity-60 text-emerald-900 dark:text-emerald-100" />
                    </button>
                    <span className="font-bold text-emerald-950 dark:text-emerald-50">Savings Goals</span>
                    <button 
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingId(null);
                            setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, color: 'bg-emerald-500', icon: 'shield' });
                            setDeleteId(null);
                        }} 
                        aria-label="Add Goal" 
                        className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-100 transition-colors"
                    >
                        {isAdding ? <X size={20}/> : <Plus size={20}/>}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white dark:bg-[#0a3831] p-6 rounded-[2rem] mb-4 border border-emerald-100 dark:border-emerald-800/30 shrink-0 animate-in zoom-in-95 shadow-xl overflow-y-auto max-h-[60vh]">
                        <h4 className="font-bold text-sm mb-5 text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                            <Target size={18} className="text-emerald-500"/> {editingId ? 'Edit Goal' : 'Create New Goal'}
                        </h4>
                        
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Goal Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Dream Vacation" 
                                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#021c17] border border-slate-100 dark:border-emerald-900/30 outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300" 
                                    value={newGoal.name} 
                                    onChange={e => setNewGoal({...newGoal, name: e.target.value})} 
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Target Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{currency}</span>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            className="w-full p-3.5 pl-8 rounded-xl bg-slate-50 dark:bg-[#021c17] border border-slate-100 dark:border-emerald-900/30 outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                                            value={newGoal.targetAmount || ''} 
                                            onChange={e => setNewGoal({...newGoal, targetAmount: parseFloat(e.target.value)})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Already Saved</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{currency}</span>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            className="w-full p-3.5 pl-8 rounded-xl bg-slate-50 dark:bg-[#021c17] border border-slate-100 dark:border-emerald-900/30 outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                                            value={newGoal.currentAmount || ''} 
                                            onChange={e => setNewGoal({...newGoal, currentAmount: parseFloat(e.target.value)})} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Appearance</label>
                                <div className="bg-slate-50 dark:bg-[#021c17] p-3 rounded-2xl border border-slate-100 dark:border-emerald-900/30">
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
                                        {icons.map(ic => {
                                            const Icon = ic.icon;
                                            const isSelected = newGoal.icon === ic.id;
                                            return (
                                                <button 
                                                    key={ic.id} 
                                                    onClick={() => setNewGoal({...newGoal, icon: ic.id})} 
                                                    className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected ? 'bg-white dark:bg-emerald-600 shadow-md text-emerald-600 dark:text-white scale-105 ring-1 ring-emerald-100 dark:ring-emerald-500' : 'text-slate-400 hover:text-emerald-500 hover:bg-white/50'}`}
                                                >
                                                    <Icon size={18} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto scrollbar-hide items-center h-8 px-1">
                                        {colors.map(c => (
                                            <button 
                                                key={c} 
                                                onClick={() => setNewGoal({...newGoal, color: c})} 
                                                className={`w-6 h-6 rounded-full shrink-0 ${c} transition-all duration-300 ${newGoal.color === c ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-[#021c17] scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                                            ></button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all hover:bg-emerald-700 mt-2 flex items-center justify-center gap-2">
                                <Save size={18}/> {editingId ? 'Update Goal' : 'Create Goal'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-hide pb-2">
                    {goals.map((goal: Goal) => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        const IconData = icons.find(i => i.id === goal.icon) || icons[0];
                        const Icon = IconData.icon;
                        const isAddingCustom = activeGoalInput === goal.id;

                        return (
                            <div key={goal.id} className="bg-white dark:bg-[#0a3831] p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700/50 group">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${goal.color} flex items-center justify-center text-white shadow-lg shadow-emerald-900/5`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-950 dark:text-emerald-50 text-lg leading-tight mb-1">{goal.name}</h4>
                                            <p className="text-xs font-bold text-slate-400">Target: {formatMoney(goal.targetAmount, currency, false)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <button onClick={() => handleEdit(goal)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><Edit2 size={16}/></button>
                                        <button onClick={() => setDeleteId(goal.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                
                                <div className="mb-2 flex justify-between items-end relative z-10">
                                    <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{formatMoney(goal.currentAmount, currency, false)}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${progress >= 100 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>{progress.toFixed(0)}%</span>
                                </div>

                                <div className="h-3 w-full bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden mb-4 relative z-10">
                                    <div className={`h-full rounded-full ${goal.color} transition-all duration-1000 relative`} style={{ width: `${progress}%` }}>
                                        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                                    </div>
                                </div>

                                <div className="flex gap-2 relative z-10">
                                    <button onClick={() => handleUpdateProgress(goal, 1000)} className="flex-1 py-2 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors active:scale-95 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">+ 1k</button>
                                    <button onClick={() => handleUpdateProgress(goal, 5000)} className="flex-1 py-2 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors active:scale-95 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">+ 5k</button>
                                    <button onClick={() => setActiveGoalInput(isAddingCustom ? null : goal.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 border border-transparent ${isAddingCustom ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-black/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}>Custom</button>
                                </div>

                                {isAddingCustom && (
                                    <div className="mt-3 flex gap-2 relative z-10 animate-in slide-in-from-top-2">
                                        <input 
                                            type="number" 
                                            placeholder="Amount" 
                                            value={customAmount} 
                                            onChange={(e) => setCustomAmount(e.target.value)} 
                                            className="flex-1 p-2 rounded-xl bg-white dark:bg-black/40 border border-emerald-200 dark:border-emerald-800 outline-none text-sm font-bold"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => {
                                                if (customAmount && !isNaN(parseFloat(customAmount))) {
                                                    handleUpdateProgress(goal, parseFloat(customAmount));
                                                }
                                            }}
                                            className="p-2 bg-emerald-600 text-white rounded-xl"
                                        >
                                            <ChevronRight size={20}/>
                                        </button>
                                    </div>
                                )}

                                <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${goal.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                            </div>
                        )
                    })}
                    {goals.length === 0 && (
                        <div className="text-center py-10 opacity-50 flex flex-col items-center">
                            <Target size={48} className="text-emerald-200 dark:text-emerald-900 mb-4"/>
                            <p className="text-emerald-900 dark:text-emerald-100 font-bold">No goals yet</p>
                            <p className="text-sm">Start saving for your dreams today!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
