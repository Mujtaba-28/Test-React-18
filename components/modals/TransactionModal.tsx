
import React from 'react';
const { useState, useRef } = React;
import Lucide from 'lucide-react';
const { X, Trash2, Calendar: CalendarIcon, Edit2, Save, Sparkles, Loader2, Camera, Split, Plus, Minus, Image: ImageIcon, Paperclip } = Lucide;
import { useTransactionForm } from '../../hooks/useTransactionForm';
import { CurrencyInput } from '../forms/CurrencyInput';
import { ConfirmationModal } from './ConfirmationModal';

interface TransactionModalProps {
  onClose: () => void;
  onSave: (tx: any) => void;
  onDelete: (id: number) => void;
  initialData: any;
  currency: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave, onDelete, initialData, currency }) => {
    const isEditing = !!initialData;
    const { 
        amount, setAmount, title, setTitle, type, setType, date, setDate,
        category, setCategory, selectedCurrency, setSelectedCurrency,
        originalAmount, setOriginalAmount, isSplitMode, setIsSplitMode,
        splits, setSplits, attachment, setAttachment, isAnalyzing,
        currentCategoryList,
        handleAttachment, analyzeReceipt, handleAiTextParse, handleSubmit
    } = useTransactionForm(initialData, currency, onSave);

    const [showAiInput, setShowAiInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const hasApiKey = !!process.env.API_KEY;
    
    const fileInputRef = useRef(null);
    const attachmentInputRef = useRef(null);
    
    const totalSplitAmount = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
    const splitRemaining = parseFloat(amount || '0') - totalSplitAmount;
    const isSplitValid = Math.abs(splitRemaining) < 1;
    const updateSplit = (idx, field, val) => {
        const newSplits = [...splits]; 
        newSplits[idx][field] = val; 
        setSplits(newSplits);
    };

    if (showAiInput) {
        return (
            <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4">
                <div className="w-full bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-emerald-950 flex items-center gap-2"><Sparkles className="text-emerald-600"/> AI Auto-Fill</h3>
                        <button onClick={() => setShowAiInput(false)} aria-label="Close AI"><X size={20}/></button>
                    </div>
                    <textarea 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Paste SMS or text e.g. 'Spent 500 on Starbucks'"
                        className="w-full h-32 p-4 rounded-2xl bg-white border border-emerald-100 resize-none outline-none mb-4 text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        autoFocus
                    ></textarea>
                    <button 
                        onClick={() => { handleAiTextParse(textInput); setShowAiInput(false); }} 
                        disabled={isAnalyzing || !textInput.trim()}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <><Sparkles size={18}/> Detect Details</>}
                    </button>
                </div>
            </div>
        )
   }

    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col relative overflow-hidden">
                
                <ConfirmationModal 
                    isOpen={showDeleteConfirm}
                    title="Delete Transaction?"
                    message="Are you sure you want to remove this transaction? This action cannot be undone."
                    onConfirm={() => {
                        if (initialData) onDelete(initialData.id);
                    }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[2.5rem]">
                        <Loader2 size={40} className="text-emerald-600 animate-spin mb-2" />
                        <span className="font-bold text-emerald-900 dark:text-emerald-100">Analyzing...</span>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4 shrink-0">
                    <button onClick={onClose} aria-label="Close" type="button" className="p-2 rounded-full bg-emerald-100/50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition-colors">
                        <X size={24} className="text-emerald-900 dark:text-emerald-100" />
                    </button>
                    <span className="font-bold text-emerald-950 dark:text-emerald-50">{isEditing ? 'Edit Transaction' : 'New Transaction'}</span>
                    <div className="flex gap-2 items-center">
                        {!isEditing && hasApiKey && (
                            <>
                             <button onClick={() => fileInputRef.current?.click()} aria-label="Scan" type="button" className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors">
                                <Camera size={20}/>
                                <input type="file" ref={fileInputRef} onChange={(e) => {if(e.target.files) analyzeReceipt(e.target.files[0])}} accept="image/*" className="hidden" />
                             </button>
                             <button onClick={() => setShowAiInput(true)} aria-label="Auto-fill" type="button" className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"><Sparkles size={20}/></button>
                            </>
                        )}
                        {isEditing && (
                            <button onClick={() => setShowDeleteConfirm(true)} aria-label="Delete" type="button" className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 text-rose-600 transition-colors z-10 relative">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 pb-safe scrollbar-hide">
                    <CurrencyInput 
                        amount={amount} setAmount={setAmount}
                        originalAmount={originalAmount} setOriginalAmount={setOriginalAmount}
                        selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency}
                        baseCurrency={currency}
                    />

                    <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-2xl flex">
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${type === 'expense' ? 'bg-white dark:bg-[#062c26] shadow-md text-rose-600 dark:text-rose-400 transform scale-[1.02]' : 'text-emerald-800/60 dark:text-emerald-100/60 hover:text-rose-500'}`}>Expense</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${type === 'income' ? 'bg-white dark:bg-[#062c26] shadow-md text-emerald-600 dark:text-emerald-400 transform scale-[1.02]' : 'text-emerald-800/60 dark:text-emerald-100/60 hover:text-emerald-500'}`}>Income</button>
                    </div>

                    <div className="bg-white dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-700 dark:text-emerald-300 shrink-0"><CalendarIcon size={18} /></div>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none w-full font-medium text-emerald-950 dark:text-emerald-50 text-sm" />
                    </div>
                    
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setIsSplitMode(!isSplitMode)} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isSplitMode ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <Split size={14}/> {isSplitMode ? 'Split Active' : 'Split Transaction'}
                        </button>
                    </div>

                    {!isSplitMode ? (
                        <div>
                            <label className="text-xs font-bold text-emerald-900/50 dark:text-emerald-100/50 ml-2 mb-2 block tracking-wider">CATEGORY</label>
                            <div className="flex gap-4 overflow-x-auto py-6 px-6 scrollbar-hide -mx-6">
                                {currentCategoryList.map(cat => (
                                    <button type="button" key={cat.id} onClick={() => setCategory(cat)} className={`flex flex-col items-center gap-2 min-w-[72px] rounded-2xl transition-all duration-300 ${category.id === cat.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}>
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 transition-all ${category.id === cat.id ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900 shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'}`}><cat.icon size={24} /></div>
                                        <span className={`text-[10px] font-bold ${category.id === cat.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-900/40 dark:text-emerald-100/40'}`}>{cat.name}</span>
                                    </button>
                                ))}
                                <div className="w-2 shrink-0"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-[#021c17] p-4 rounded-2xl border border-dashed border-slate-300 dark:border-emerald-900/50">
                            <div className="space-y-3">
                                {splits.map((split, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <select value={split.category} onChange={(e) => updateSplit(idx, 'category', e.target.value)} className="flex-1 bg-white dark:bg-[#0a3831] p-2 rounded-xl text-xs font-bold outline-none">
                                            {currentCategoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <input type="number" value={split.amount} onChange={(e) => updateSplit(idx, 'amount', parseFloat(e.target.value))} className="w-20 bg-white dark:bg-[#0a3831] p-2 rounded-xl text-xs font-bold outline-none text-right" placeholder="0"/>
                                        <button type="button" onClick={() => setSplits(splits.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full shrink-0"><Minus size={14}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-emerald-900/30">
                                <button type="button" onClick={() => setSplits([...splits, { category: currentCategoryList[0].name, amount: 0 }])} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Split</button>
                                <span className={`text-xs font-bold ${isSplitValid ? 'text-emerald-600' : 'text-rose-500'}`}>Total: {totalSplitAmount} / {amount || 0}</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-4 flex items-center gap-4 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
                        <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-700 dark:text-emerald-300 shrink-0"><Edit2 size={18} /></div>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note (Optional)" className="bg-transparent outline-none w-full font-medium text-emerald-950 dark:text-emerald-50 placeholder:text-emerald-900/30 dark:placeholder:text-emerald-100/30 py-1" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-emerald-900/50 dark:text-emerald-100/50 ml-2 block tracking-wider">ATTACH FILE</label>
                        <input type="file" ref={attachmentInputRef} onChange={handleAttachment} onClick={(e) => (e.target).value = ''} accept="image/*" className="hidden" />
                        {!attachment ? (
                            <div onClick={() => attachmentInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 dark:border-emerald-800/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#021c17] transition-colors group">
                                <div className="p-3 bg-slate-100 dark:bg-black/20 rounded-full text-slate-400 group-hover:text-emerald-500 transition-colors"><Paperclip size={24} /></div>
                                <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-600">Tap to Attach Image</span>
                            </div>
                        ) : (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden group border border-slate-200 dark:border-emerald-800/50">
                                <img src={attachment} className="w-full h-full object-cover" alt="attachment" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                    <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors backdrop-blur-md"><ImageIcon size={20}/></button>
                                    <button type="button" onClick={() => setAttachment(null)} className="p-3 bg-rose-500/80 hover:bg-rose-600 rounded-full text-white transition-colors backdrop-blur-md"><X size={20}/></button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full py-4 rounded-2xl bg-emerald-950 dark:bg-emerald-100 text-white dark:text-emerald-950 font-bold text-lg shadow-lg active:scale-[0.98] transition-transform hover:shadow-xl flex items-center justify-center gap-2">
                        <Save size={20} />
                        {isEditing ? 'Update Transaction' : 'Save Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
};
