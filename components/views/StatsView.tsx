
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, ThumbsUp, BarChart, Settings2, Eye, ArrowUp, ArrowDown, Loader2, HelpCircle, Check, EyeOff as EyeOffIcon } from 'lucide-react';
import { DashboardCard } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants';
import { formatMoney } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createAnalyticsWorker } from '../../utils/worker';

interface StatsViewProps {
  isPrivacyMode: boolean;
  currentDate: Date;
  changeMonth: (offset: number) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ isPrivacyMode, currentDate, changeMonth }) => {
    const { transactions, budgets, activeContext } = useFinance();
    const { currency } = useTheme();
    const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
    const [isEditingLayout, setIsEditingLayout] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [stats, setStats] = useState<any>(null);
    const workerRef = useRef<Worker | null>(null);

    const [cardOrder, setCardOrder] = useState<DashboardCard[]>([
        { id: 'prediction', label: 'Forecast & Status', visible: true },
        { id: 'cashflow', label: '6-Month Cash Flow', visible: true },
        { id: 'cat_budgets', label: 'Category Limits', visible: true },
        { id: 'trend', label: 'Spending Trends', visible: true },
        { id: 'averages', label: 'Daily Averages', visible: true },
        { id: 'breakdown', label: 'Visual Breakdown', visible: true },
    ]);

    useEffect(() => {
        workerRef.current = createAnalyticsWorker();
        workerRef.current.onmessage = (e) => {
            if (e.data.error) {
                console.error("Worker Error", e.data.error);
            } else {
                setStats(e.data);
            }
            setIsLoading(false);
        };
        return () => workerRef.current?.terminate();
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            const sanitizeCats = (cats: any[]) => cats.map(({ icon, ...rest }) => rest);
            const sanitizeTxs = (txs: any[]) => txs.map(({ icon, ...rest }) => rest);

            workerRef.current.postMessage({
                transactions: sanitizeTxs(transactions),
                currentDateStr: currentDate.toISOString(),
                budgets,
                viewType,
                activeContext,
                EXPENSE_CATEGORIES: sanitizeCats(EXPENSE_CATEGORIES),
                INCOME_CATEGORIES: sanitizeCats(INCOME_CATEGORIES)
            });
        }
    }, [transactions, currentDate, budgets, viewType, activeContext]);

    const toggleCardVisibility = (id: string) => {
        setCardOrder(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    };

    const moveCard = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === cardOrder.length - 1) return;
        
        const newOrder = [...cardOrder];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
        setCardOrder(newOrder);
    };

    const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!stats && isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-emerald-500 mb-2" size={32}/>
                <p className="text-sm font-bold text-slate-400">Crunching numbers...</p>
            </div>
        );
    }
    
    if (!stats) return null;

    const { 
        activeTotal, cumulativeSpending, predictedTotal, isOverBudget, 
        currentDailyAverage, categoryData, maxCategoryVal, totalForDonut, 
        currentBudget, daysInMonth, runningTotal, cashFlow
    } = stats;
    
    const daysLeft = daysInMonth - new Date().getDate();
    const remainingMonthBudget = currentBudget - activeTotal;
    const recommendedDailyAverage = daysLeft > 0 && remainingMonthBudget > 0 ? remainingMonthBudget / daysLeft : 0;
    const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
    const daysPassed = Math.max(isCurrentMonth ? new Date().getDate() : daysInMonth, 1);

    const SVG_HEIGHT = 220;
    const SVG_WIDTH = 350;
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 30; 
    const PADDING_LEFT = 40;   
    const PADDING_RIGHT = 15;
    const GRAPH_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const GRAPH_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    let maxY = Math.max(predictedTotal, 10000); 
    if (viewType === 'expense') maxY = Math.max(maxY, currentBudget);
    maxY = maxY * 1.1; 

    const scaleX = GRAPH_WIDTH / (daysInMonth - 1 || 1); 
    const scaleY = GRAPH_HEIGHT / (maxY > 0 ? maxY : 1); 
    const zeroY = SVG_HEIGHT - PADDING_BOTTOM;

    const getX = (index: number) => PADDING_LEFT + (index * scaleX);
    const getY = (val: number) => zeroY - (val * scaleY);

    const polylinePoints = cumulativeSpending.map((val: number, i: number) => `${getX(i)},${getY(val)}`).join(' ');
    const areaPath = cumulativeSpending.length > 0 
        ? `M ${getX(0)},${zeroY} ${cumulativeSpending.map((val: number, i: number) => `L ${getX(i)},${getY(val)}`).join(' ')} L ${getX(cumulativeSpending.length - 1)},${zeroY} Z`
        : '';

    const limitY = getY(currentBudget);
    const lastActualPoint = { x: getX(daysPassed - 1), y: getY(runningTotal) };
    const predictedEndPoint = { x: getX(daysInMonth - 1), y: getY(predictedTotal) };

    const chartTheme = isOverBudget 
        ? { stroke: '#f43f5e', fill: 'url(#gradientRed)', point: '#f43f5e' } 
        : { stroke: '#10b981', fill: 'url(#gradientGreen)', point: '#10b981' }; 
    
    if (viewType === 'income') {
        chartTheme.stroke = '#10b981';
        chartTheme.fill = 'url(#gradientGreen)';
        chartTheme.point = '#10b981';
    }

    const xLabels: any[] = [];
    const labelInterval = Math.ceil(daysInMonth / 5); 
    for (let i = 0; i < daysInMonth; i += labelInterval) xLabels.push(i);
    if (xLabels[xLabels.length - 1] !== daysInMonth - 1) xLabels.push(daysInMonth - 1); 

    const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];
    const formatYLabel = (val: number) => {
        if (val >= 100000) return (val / 100000).toFixed(1).replace('.0','') + 'L'; 
        if (val >= 1000) return (val / 1000).toFixed(1).replace('.0','') + 'k';
        return val.toFixed(0);
    };

    let currentDeg = 0;
    const gradientString = categoryData.map((cat: any) => {
        const deg = (totalForDonut > 0) ? (cat.amount / totalForDonut) * 360 : 0;
        const color = cat.code;
        const str = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return str;
    }).join(', ');
    const finalGradient = gradientString || '#e2e8f0 0deg 360deg'; 

    const renderDashboardCard = (card: DashboardCard) => {
        if (!card.visible) return null;
        
        if (card.id === 'prediction') {
            return (
                <div key={card.id} className={`p-6 rounded-[2rem] shadow-lg relative overflow-hidden text-white ${isOverBudget ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
                        <div className="relative z-10 flex gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl h-fit">
                            {isOverBudget ? <AlertTriangle size={24} /> : <ThumbsUp size={24} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">{isOverBudget ? 'Over Budget Alert' : viewType === 'income' ? 'Income Forecast' : 'On Track'}</h4>
                            <p className="text-sm opacity-90 leading-relaxed">
                                {viewType === 'expense' ? 'Spend' : 'Income'} Forecast: {formatMoney(predictedTotal, currency, isPrivacyMode)}. 
                            </p>
                        </div>
                    </div>
                </div>
            );
        } else if (card.id === 'cashflow') {
            const maxCF = Math.max(...cashFlow.map((c: any) => Math.max(c.income, c.expense)), 100);
            return (
                <div key={card.id} className="bg-white dark:bg-[#0a3831] p-6 rounded-[2rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                     <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-6 flex items-center gap-2">6-Month Cash Flow</h3>
                     <div className="flex justify-between items-end h-32 gap-2">
                         {cashFlow.map((cf: any, i: number) => (
                             <div key={i} className="flex flex-col items-center flex-1 gap-1">
                                 <div className="flex gap-0.5 items-end w-full justify-center h-full">
                                     <div className="w-1.5 bg-emerald-400 rounded-t-sm" style={{ height: `${(cf.income / maxCF) * 100}%` }}></div>
                                     <div className="w-1.5 bg-rose-400 rounded-t-sm" style={{ height: `${(cf.expense / maxCF) * 100}%` }}></div>
                                 </div>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">{cf.month}</span>
                             </div>
                         ))}
                     </div>
                     <div className="flex gap-4 justify-center mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Income</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-400 rounded-full"></div> Expense</span>
                     </div>
                </div>
            );
        } else if (card.id === 'cat_budgets' && viewType === 'expense') {
            return (
                <div key={card.id} className="bg-white dark:bg-[#0a3831] p-6 rounded-[2rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                    <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-4">Category Budgets</h3>
                    <div className="space-y-4">
                        {categoryData.filter((c: any) => c.budget > 0).map((cat: any) => {
                             const percent = (cat.amount / cat.budget) * 100;
                             const isOver = percent > 100;
                             const originalCategory = EXPENSE_CATEGORIES.find(c => c.name === cat.name);
                             const Icon = originalCategory?.icon || HelpCircle;
                             
                             return (
                                 <div key={cat.id}>
                                     <div className="flex justify-between text-xs font-bold mb-1">
                                         <div className="flex items-center gap-2">
                                            <Icon size={12} className="text-slate-400"/>
                                            <span className="text-emerald-900 dark:text-emerald-100">{cat.name}</span>
                                         </div>
                                         <span className={isOver ? 'text-rose-500' : 'text-slate-400'}>
                                             {formatMoney(cat.amount, currency, isPrivacyMode)} / {formatMoney(cat.budget, currency, isPrivacyMode)}
                                         </span>
                                     </div>
                                     <div className="h-2 w-full bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden">
                                         <div 
                                            className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                         ></div>
                                     </div>
                                 </div>
                             )
                        })}
                        {categoryData.filter((c: any) => c.budget > 0).length === 0 && (
                            <p className="text-center text-xs text-slate-400 py-4">No category limits set.</p>
                        )}
                    </div>
                </div>
            );
        } else if (card.id === 'trend') {
            return (
                <div key={card.id} className="bg-white dark:bg-[#0a3831] p-6 rounded-[2rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                            <BarChart size={18} className="text-emerald-600"/> {viewType === 'expense' ? 'Spending' : 'Income'} Trend
                        </h3>
                    </div>
                    
                    <div className="h-48 relative w-full overflow-hidden">
                        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradientGreen" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                                </linearGradient>
                                <linearGradient id="gradientRed" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            {yTicks.map((val, i) => {
                                const y = getY(val);
                                if (isNaN(y)) return null;
                                return (
                                    <g key={`y-${i}`}>
                                        <line x1={PADDING_LEFT} y1={y} x2={SVG_WIDTH - PADDING_RIGHT} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeOpacity={isPrivacyMode ? 0 : 0.5} className="dark:stroke-emerald-800/30"/>
                                        <text x={PADDING_LEFT - 6} y={y + 3} fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="end" className="select-none">{formatYLabel(val)}</text>
                                    </g>
                                );
                            })}
                            {xLabels.map((dayIndex) => {
                                const x = getX(dayIndex);
                                return (<line key={`grid-x-${dayIndex}`} x1={x} y1={zeroY} x2={x} y2={PADDING_TOP} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" className="opacity-30 dark:opacity-10"/>);
                            })}
                            {viewType === 'expense' && (<line x1={PADDING_LEFT} y1={limitY} x2={SVG_WIDTH - PADDING_RIGHT} y2={limitY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />)}
                            {activeTotal > 0 && <path d={areaPath} fill={chartTheme.fill} />}
                            {activeTotal > 0 && <polyline points={polylinePoints} fill="none" stroke={chartTheme.stroke} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>}
                            {isCurrentMonth && <line x1={lastActualPoint.x} y1={lastActualPoint.y} x2={predictedEndPoint.x} y2={predictedEndPoint.y} stroke={chartTheme.stroke} strokeWidth="2" strokeDasharray="4 4" className="opacity-60"/>}
                            {activeTotal > 0 && <circle cx={lastActualPoint.x} cy={lastActualPoint.y} r="3" fill={chartTheme.point} />}
                            {isCurrentMonth && <circle cx={predictedEndPoint.x} cy={predictedEndPoint.y} r="3" fill={chartTheme.point} className="opacity-60"/>}
                            {xLabels.map((dayIndex) => {
                                const xPos = getX(dayIndex);
                                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayIndex + 1);
                                const anchor = dayIndex === 0 ? 'start' : (dayIndex === daysInMonth - 1 ? 'end' : 'middle');
                                const finalX = dayIndex === 0 ? xPos + 2 : (dayIndex === daysInMonth - 1 ? xPos - 2 : xPos);
                                return (<text key={`label-${dayIndex}`} x={finalX} y={SVG_HEIGHT - 5} fontSize="9" fill="#94a3b8" fontWeight="bold" textAnchor={anchor} className="select-none">{dateObj.getDate()} {dateObj.toLocaleDateString('default', { month: 'short' })}</text>);
                            })}
                        </svg>
                    </div>
                </div>
            );
        } else if (card.id === 'averages') {
            return (
                <div key={card.id} className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Daily Avg</p>
                        <p className="text-xl font-black text-emerald-900 dark:text-emerald-50">{formatMoney(Math.round(currentDailyAverage), currency, isPrivacyMode)}</p>
                    </div>
                    {viewType === 'expense' ? (
                        <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recommended Daily</p>
                            <p className={`text-xl font-black ${recommendedDailyAverage < currentDailyAverage ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {formatMoney(Math.round(recommendedDailyAverage), currency, isPrivacyMode)}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Projected Income</p>
                            <p className="text-xl font-black text-emerald-500">
                                {formatMoney(Math.round(predictedTotal), currency, isPrivacyMode)}
                            </p>
                        </div>
                    )}
                </div>
            );
        } else if (card.id === 'breakdown') {
            return (
                <div key={card.id} className="bg-white dark:bg-[#0a3831] p-6 rounded-[2rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-emerald-950 dark:text-emerald-50">Visual Breakdown</h3>
                    </div>
                    <div className="flex justify-center mb-8">
                            {totalForDonut > 0 ? (
                            <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-inner"
                                    style={{ background: `conic-gradient(${finalGradient})` }}>
                                <div className="w-32 h-32 bg-white dark:bg-[#0a3831] rounded-full flex flex-col items-center justify-center z-10 shadow-sm">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase">{viewType === 'expense' ? 'Spent' : 'Income'}</span>
                                    <span className="text-xl font-black text-emerald-900 dark:text-emerald-50">{formatMoney(totalForDonut, currency, isPrivacyMode)}</span>
                                </div>
                            </div>
                        ) : (
                                <div className="w-48 h-48 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-sm">No Data</div>
                        )}
                    </div>
                    <div className="space-y-5">
                        {categoryData.length > 0 ? categoryData.map((cat: any) => {
                            const percent = (cat.amount / maxCategoryVal) * 100;
                            const share = (totalForDonut > 0) ? (cat.amount / totalForDonut) * 100 : 0;
                            
                            const originalCategory = (viewType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find(c => c.name === cat.name);
                            const Icon = originalCategory?.icon || HelpCircle;
                            
                            return (
                                <div key={cat.id}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color || 'bg-slate-100 text-slate-500'}`}>
                                                <Icon size={14} />
                                            </div>
                                            <span className="font-bold text-sm text-emerald-900 dark:text-emerald-100">{cat.name} <span className="text-xs text-slate-400 ml-1">({share.toFixed(1)}%)</span></span>
                                        </div>
                                        <span className="font-bold text-emerald-900 dark:text-emerald-100">{formatMoney(cat.amount, currency, isPrivacyMode)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${viewType === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            )
                        }) : <p className="text-center text-slate-400 text-sm">No {viewType}s recorded this month.</p>}
                    </div>
                </div>
            );
        }
    };

    if (isEditingLayout) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
                <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#0a3831] p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                    <div>
                        <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">Dashboard Layout</h2>
                        <p className="text-slate-400 text-xs">Tap eye to hide • Arrows to move</p>
                    </div>
                    <button onClick={() => setIsEditingLayout(false)} className="p-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 hover:bg-emerald-700 transition-colors">
                        <Check size={16}/> Done
                    </button>
                </div>
                
                <div className="space-y-3">
                    {cardOrder.map((card, index) => (
                        <div key={card.id} className={`p-4 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-300 ${card.visible ? 'bg-white dark:bg-[#0a3831] border-emerald-100 dark:border-emerald-800/30' : 'bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                            
                            <div className="flex flex-col gap-1 text-slate-400">
                                <button 
                                    onClick={() => moveCard(index, 'up')} 
                                    disabled={index === 0} 
                                    className="p-1 hover:text-emerald-500 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                                >
                                    <ArrowUp size={18}/>
                                </button>
                                <button 
                                    onClick={() => moveCard(index, 'down')} 
                                    disabled={index === cardOrder.length - 1} 
                                    className="p-1 hover:text-emerald-500 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                                >
                                    <ArrowDown size={18}/>
                                </button>
                            </div>

                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-700"></div>

                            <div className="flex-1">
                                <span className="font-bold text-emerald-950 dark:text-emerald-50 block">{card.label}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{card.visible ? 'Visible' : 'Hidden'}</span>
                            </div>

                            <button 
                                onClick={() => toggleCardVisibility(card.id)}
                                className={`p-3 rounded-xl transition-colors ${card.visible ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                            >
                                {card.visible ? <Eye size={20}/> : <EyeOffIcon size={20}/>}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300 space-y-6 pb-20 max-w-md mx-auto">
                <div className="flex items-center justify-between bg-white dark:bg-[#0a3831] p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                <button onClick={() => changeMonth(-1)} aria-label="Previous Month" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft size={20} className="text-emerald-900 dark:text-emerald-100"/></button>
                <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-50">{currentMonthName}</h2>
                <button onClick={() => changeMonth(1)} aria-label="Next Month" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight size={20} className="text-emerald-900 dark:text-emerald-100"/></button>
                </div>
                <div className="flex gap-3 items-center">
                <div className="flex-1 bg-white dark:bg-[#0a3831] p-1 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex">
                    <button onClick={() => setViewType('expense')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewType === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'text-slate-400'}`}>Expenses</button>
                    <button onClick={() => setViewType('income')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewType === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400'}`}>Income</button>
                </div>
                <button onClick={() => setIsEditingLayout(true)} className="p-3 rounded-xl border bg-white dark:bg-[#0a3831] border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" aria-label="Edit Dashboard Layout"><Settings2 size={18} /></button>
                </div>
            <div className="space-y-6">
                {cardOrder.map((card) => renderDashboardCard(card))}
            </div>
        </div>
    )
};
