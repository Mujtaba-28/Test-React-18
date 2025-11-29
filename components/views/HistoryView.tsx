
import React, { useState, useMemo } from 'react';
import { Filter, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Transaction } from '../../types';
import { TransactionItem } from '../TransactionItem';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FixedSizeList as List } from 'react-window';

interface HistoryViewProps {
  onEditTx: (tx: Transaction) => void;
  isPrivacyMode: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onEditTx, isPrivacyMode }) => {
    const { transactions } = useFinance();
    const { currency } = useTheme();
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('all'); 
    const [sortOrder, setSortOrder] = useState('newest'); 
    const [timeline, setTimeline] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // New Advanced Filters
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    // Memoized filtering...
    const displayTransactions = useMemo(() => {
        let data = [...transactions];
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(t => 
                t.title.toLowerCase().includes(query) || 
                t.category.toLowerCase().includes(query) ||
                t.amount.toString().includes(query)
            );
        }

        if (filterType !== 'all') data = data.filter(t => t.type === filterType);
        
        const now = new Date();
        if (timeline === 'today') data = data.filter(t => new Date(t.date).toDateString() === now.toDateString());
        else if (timeline === 'week') { const d = new Date(); d.setDate(d.getDate()-7); data = data.filter(t => new Date(t.date) >= d); }
        else if (timeline === 'month') { const d = new Date(); d.setMonth(d.getMonth()-1); data = data.filter(t => new Date(t.date) >= d); }

        if (startDate) data = data.filter(t => new Date(t.date) >= new Date(startDate));
        if (endDate) data = data.filter(t => new Date(t.date) <= new Date(endDate));

        if (minAmount) data = data.filter(t => t.amount >= parseFloat(minAmount));
        if (maxAmount) data = data.filter(t => t.amount <= parseFloat(maxAmount));
        
        if (selectedCategories.length > 0) {
            data = data.filter(t => selectedCategories.includes(t.category));
        }

        if (sortOrder === 'newest') data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (sortOrder === 'oldest') data.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sortOrder === 'high') data.sort((a,b) => b.amount - a.amount);
        if (sortOrder === 'low') data.sort((a,b) => a.amount - b.amount);

        return data;
    }, [transactions, filterType, sortOrder, timeline, minAmount, maxAmount, startDate, endDate, selectedCategories, searchQuery]);

    const toggleCategory = (catName: string) => {
        if (selectedCategories.includes(catName)) {
            setSelectedCategories(prev => prev.filter(c => c !== catName));
        } else {
            setSelectedCategories(prev => [...prev, catName]);
        }
    };
    
    const clearFilters = () => {
        setFilterType('all');
        setTimeline('all');
        setMinAmount('');
        setMaxAmount('');
        setStartDate('');
        setEndDate('');
        setSelectedCategories([]);
        setSearchQuery('');
    };

    // Standard Row Component (No Swipe)
    const Row = ({ index, style, data }: { index: number, style: React.CSSProperties, data: Transaction[] }) => {
        const tx = data[index];
        return (
            <div style={{ ...style, paddingBottom: 8, paddingRight: 4 }}>
                <TransactionItem tx={tx} onClick={onEditTx} currency={currency} isPrivacyMode={isPrivacyMode} />
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-4 h-full flex flex-col max-w-md mx-auto">
             <div className="flex flex-col gap-3 mb-2 shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">History</h2>
                    <div className="flex gap-2">
                        <div className="flex bg-white dark:bg-[#0a3831] rounded-xl border border-emerald-100 dark:border-emerald-800/30 overflow-hidden">
                            <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className={`p-2 px-3 transition-colors ${sortOrder === 'newest' || sortOrder === 'oldest' ? 'bg-emerald-50 dark:bg-emerald-900/50' : ''}`}>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-200 uppercase">
                                Date {sortOrder === 'newest' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                            </div>
                            </button>
                            <div className="w-px bg-emerald-100 dark:bg-emerald-800/30"></div>
                            <button onClick={() => setSortOrder(prev => prev === 'high' ? 'low' : 'high')} className={`p-2 px-3 transition-colors ${sortOrder === 'high' || sortOrder === 'low' ? 'bg-emerald-50 dark:bg-emerald-900/50' : ''}`}>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-200 uppercase">
                                Amt {sortOrder === 'high' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                            </div>
                            </button>
                        </div>

                        <button onClick={() => setShowFilters(!showFilters)} aria-label="Toggle Filters" className={`p-2 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-[#0a3831] dark:border-emerald-800/30 dark:text-emerald-100'}`}>
                            <Filter size={16}/>
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-[#0a3831] p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3 shadow-sm">
                    <Search size={18} className="text-slate-400 ml-2"/>
                    <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        className="bg-transparent outline-none flex-1 text-sm font-bold text-slate-700 dark:text-emerald-50 placeholder:text-slate-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
             </div>
             
             {showFilters && (
                 <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl shadow-lg border border-emerald-100 dark:border-emerald-800/30 mb-4 animate-in slide-in-from-top-2 space-y-4 max-h-[60vh] overflow-y-auto shrink-0">
                     <div className="flex justify-between items-center">
                         <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Filters</p>
                         <button onClick={clearFilters} className="text-[10px] font-bold text-rose-500 hover:text-rose-600">Clear All</button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">From Date</p>
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-black/20 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-emerald-500"/>
                         </div>
                         <div>
                             <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">To Date</p>
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-black/20 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-emerald-500"/>
                         </div>
                     </div>

                     <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Category</p>
                        <div className="flex flex-wrap gap-2">
                             {allCategories.map(cat => (
                                 <button 
                                    key={cat.id} 
                                    onClick={() => toggleCategory(cat.name)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${selectedCategories.includes(cat.name) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-black/20 text-slate-500 border-transparent hover:border-slate-300'}`}
                                 >
                                     {cat.name}
                                 </button>
                             ))}
                        </div>
                     </div>
                 </div>
             )}

             <div className="flex-1 pb-4 h-full">
                {displayTransactions.length > 0 ? (
                    <List
                        height={600}
                        itemCount={displayTransactions.length}
                        itemSize={90}
                        width="100%"
                        className="scrollbar-hide"
                        itemData={displayTransactions}
                    >
                        {Row}
                    </List>
                ) : (
                    <div className="text-center py-10 opacity-50 text-emerald-900 dark:text-emerald-100">No transactions match your search.</div>
                )}
             </div>
        </div>
    )
};