import React from 'react';
import { Target, TrendingDown, Repeat, ChevronRight, Wallet, Shield, Zap } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMoney } from '../../utils';

interface PlanViewProps {
  onOpenSubscriptions: () => void;
  onOpenGoals: () => void;
  onOpenDebts: () => void;
  isPrivacyMode: boolean;
}

export const PlanView: React.FC<PlanViewProps> = ({ onOpenSubscriptions, onOpenGoals, onOpenDebts, isPrivacyMode }) => {
    const { subscriptions, goals, debts } = useFinance();
    const { currency } = useTheme();

    // --- CALCULATIONS ---
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
    const totalMonthlySubs = subscriptions.reduce((acc, sub) => acc + calculateMonthlyCost(sub.amount, sub.billingCycle), 0);

    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalGoalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const goalProgress = totalGoalTarget > 0 ? (totalSaved / totalGoalTarget) * 100 : 0;

    const totalDebt = debts.reduce((acc, d) => acc + d.currentBalance, 0);
    
    // Sort items for preview lists
    const upcomingSubs = [...subscriptions].sort((a,b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()).slice(0, 3);
    const topGoals = [...goals].sort((a,b) => (b.currentAmount/b.targetAmount) - (a.currentAmount/a.targetAmount)).slice(0, 3);

    return (
        <div className="animate-in fade-in duration-500 space-y-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Financial Plan</h2>
            
            {/* SUBSCRIPTIONS CARD */}
            <div onClick={onOpenSubscriptions} className="bg-white dark:bg-[#0a3831] p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Repeat size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-950 dark:text-emerald-50 text-lg">Subscriptions</h3>
                            <p className="text-xs font-bold text-slate-400">{subscriptions.length} Active</p>
                        </div>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-full text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={20}/>
                    </div>
                </div>
                
                <div className="mb-4 relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Fixed Cost</p>
                    <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{formatMoney(totalMonthlySubs, currency, isPrivacyMode)}</p>
                </div>

                {upcomingSubs.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-emerald-800/30 space-y-2 relative z-10">
                        {upcomingSubs.map(sub => (
                             <div key={sub.id} className="flex justify-between items-center text-xs">
                                 <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {sub.name}
                                 </span>
                                 <span className="font-medium text-slate-400">{new Date(sub.nextBillingDate).getDate()}th</span>
                             </div>
                        ))}
                    </div>
                )}
                
                <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12">
                    <Zap size={150} className="text-indigo-900 dark:text-indigo-100"/>
                </div>
            </div>

            {/* GOALS CARD */}
            <div onClick={onOpenGoals} className="bg-emerald-600 p-6 rounded-[2.5rem] shadow-lg shadow-emerald-600/20 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Savings Goals</h3>
                            <p className="text-xs font-bold text-emerald-100/70">{goals.length} Goals Set</p>
                        </div>
                    </div>
                    <div className="p-2 bg-white/10 rounded-full text-white group-hover:bg-white/20 transition-colors">
                        <ChevronRight size={20}/>
                    </div>
                </div>
                
                <div className="mb-6 relative z-10">
                    <div className="flex justify-between text-xs font-bold text-emerald-100 mb-2 uppercase tracking-widest">
                        <span>Total Saved</span>
                        <span>{Math.round(goalProgress)}%</span>
                    </div>
                    <p className="text-3xl font-black text-white mb-3">{formatMoney(totalSaved, currency, isPrivacyMode)}</p>
                    <div className="h-2 w-full bg-emerald-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: `${goalProgress}%` }}></div>
                    </div>
                </div>

                {topGoals.length > 0 && (
                    <div className="pt-4 border-t border-white/10 space-y-2 relative z-10">
                         {topGoals.map(g => (
                             <div key={g.id} className="flex justify-between items-center text-xs text-white/90">
                                 <span className="font-bold flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full bg-white`}></div> {g.name}
                                 </span>
                                 <span className="font-medium opacity-80">{formatMoney(g.currentAmount, currency, isPrivacyMode)}</span>
                             </div>
                         ))}
                    </div>
                )}

                 <div className="absolute -right-8 -bottom-8 opacity-10 rotate-[-10deg]">
                    <Shield size={160} className="text-white"/>
                </div>
            </div>

            {/* DEBTS CARD */}
            <div onClick={onOpenDebts} className="bg-white dark:bg-[#0a3831] p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-950 dark:text-emerald-50 text-lg">Debt Planner</h3>
                            <p className="text-xs font-bold text-slate-400">{debts.length} Liabilities</p>
                        </div>
                    </div>
                     <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-full text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={20}/>
                    </div>
                </div>
                
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
                    <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{formatMoney(totalDebt, currency, isPrivacyMode)}</p>
                </div>
                
                 <div className="absolute -right-8 -bottom-6 opacity-5 rotate-12">
                    <Wallet size={140} className="text-rose-900 dark:text-rose-100"/>
                </div>
            </div>
        </div>
    );
};