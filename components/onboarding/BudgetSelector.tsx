
import React, { useState } from 'react';
import { User, Briefcase, ChevronRight, Plus, X, Folder, Check, Trash2, Calendar, Edit2, Home, Car, Gift, Zap, ShoppingBag, Plane, Coffee, CreditCard, Heart, Laptop, Smartphone, Smile } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { BudgetContext, ContextMetadata } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { SelectSheet } from '../ui/SelectSheet';

interface BudgetSelectorProps {
  onSelect: (context: BudgetContext) => void;
  userName: string;
}

export const BudgetSelector: React.FC<BudgetSelectorProps> = ({ onSelect, userName }) => {
  const { customContexts, addContext, deleteContext, updateContext, budgets } = useFinance();
  const { currency } = useTheme();
  
  const [isEditingList, setIsEditingList] = useState(false);
  const [formState, setFormState] = useState<{ mode: 'create' | 'edit'; context?: ContextMetadata } | null>(null);
  
  const [name, setName] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState('monthly');
  const [selectedIcon, setSelectedIcon] = useState('Folder');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const availableIcons = [
      { name: 'Folder', icon: Folder },
      { name: 'User', icon: User },
      { name: 'Briefcase', icon: Briefcase },
      { name: 'Home', icon: Home },
      { name: 'Car', icon: Car },
      { name: 'Gift', icon: Gift },
      { name: 'Zap', icon: Zap },
      { name: 'ShoppingBag', icon: ShoppingBag },
      { name: 'Plane', icon: Plane },
      { name: 'Coffee', icon: Coffee },
      { name: 'CreditCard', icon: CreditCard },
      { name: 'Heart', icon: Heart },
      { name: 'Laptop', icon: Laptop },
      { name: 'Smartphone', icon: Smartphone },
      { name: 'Smile', icon: Smile },
  ];

  const openForm = (mode: 'create' | 'edit', context?: ContextMetadata) => {
    setFormState({ mode, context });
    if (mode === 'edit' && context) {
        setName(context.name);
        setDescription(context.description || '');
        setTimeline(context.timeline);
        setSelectedIcon(context.icon || 'Folder');
        const budgetKey = `${context.id}-default`;
        const budgetAmount = budgets[budgetKey];
        setInitialBudget(budgetAmount ? budgetAmount.toString() : '');
    } else {
        setName('');
        setInitialBudget('');
        setDescription('');
        setTimeline('monthly');
        setSelectedIcon('Folder');
    }
  };

  const closeForm = () => {
    setFormState(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && formState) {
        const amount = parseFloat(initialBudget) || 0;
        if (formState.mode === 'create') {
            addContext(name.trim(), amount, description, timeline, selectedIcon);
        } else if (formState.mode === 'edit' && formState.context) {
            updateContext(formState.context.id, {
                name: name.trim(),
                description,
                timeline,
                initialBudget: amount,
                icon: selectedIcon
            });
        }
        closeForm();
    }
  };

  const handleDelete = () => {
      if (deleteId) {
          deleteContext(deleteId);
          setDeleteId(null);
          if (customContexts.length <= 1) setIsEditingList(false);
      }
  };

  const timelineOptions = [
      { value: 'monthly', label: 'Monthly Budget' },
      { value: 'weekly', label: 'Weekly Budget' },
      { value: 'yearly', label: 'Yearly Budget' },
      { value: 'project', label: 'Project Based' },
  ];

  const getContextStyle = (ctx: ContextMetadata) => {
      const IconObj = availableIcons.find(i => i.name === ctx.icon) || { icon: Folder };
      const Icon = IconObj.icon;
      
      let color = 'blue';
      if (ctx.type === 'personal') color = 'indigo';
      else if (ctx.type === 'business') color = 'teal';
      else if (ctx.icon === 'Home') color = 'orange';
      else if (ctx.icon === 'Car') color = 'rose';
      else if (ctx.icon === 'Plane') color = 'sky';
      else if (ctx.icon === 'Gift') color = 'pink';
      
      return { icon: Icon, color, decor: <Icon size={100}/> };
  };

  const renderCard = (ctx: ContextMetadata) => {
      const style = getContextStyle(ctx);
      const Icon = style.icon;
      const color = style.color;

      return (
        <div key={ctx.id} className={`group relative bg-white dark:bg-[#0a3831] rounded-[2rem] border shadow-sm transition-all duration-300 overflow-hidden w-full shrink-0 ${isEditingList ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-emerald-100 dark:border-emerald-800/30 hover:shadow-xl'}`}>
            <button 
                onClick={() => !isEditingList && onSelect(ctx.id)}
                className={`w-full p-6 text-left transition-transform z-10 relative ${isEditingList ? 'cursor-default' : 'active:scale-[0.98]'}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 bg-${color}-50 dark:bg-${color}-900/30 rounded-2xl flex items-center justify-center text-${color}-600 dark:text-${color}-400 transition-transform ${!isEditingList && 'group-hover:scale-110'}`}>
                        <Icon size={24} strokeWidth={2.5}/>
                    </div>
                    {!isEditingList && (
                        <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-full text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <ChevronRight size={20}/>
                        </div>
                    )}
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-50 capitalize">{ctx.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-2">{ctx.description || 'No description'}</p>
                    {ctx.timeline && (
                        <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-black/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <Calendar size={10}/> {ctx.timeline}
                        </div>
                    )}
                </div>
            </button>
            
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 text-slate-900 dark:text-white pointer-events-none">
                {style.decor}
            </div>

            {isEditingList && (
                <div className="absolute top-4 right-4 z-20 animate-in zoom-in-50 duration-200 flex gap-2">
                    <button 
                        onClick={() => openForm('edit', ctx)}
                        className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                        <Edit2 size={16}/>
                    </button>
                    <button 
                        onClick={() => setDeleteId(ctx.id)}
                        className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors"
                    >
                        <Trash2 size={16}/>
                    </button>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-emerald-50 dark:bg-[#021c17] flex flex-col animate-in fade-in duration-500">
      
      <ConfirmationModal 
          isOpen={!!deleteId}
          title="Delete Budget?"
          message="This will permanently delete this budget and ALL its transactions, goals, and plans. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
      />

      {formState && (
         <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0a3831] w-full max-w-sm p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30 shadow-xl animate-in slide-in-from-bottom-10 duration-300 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-emerald-950 dark:text-emerald-50 text-lg">{formState.mode === 'create' ? 'New Budget Plan' : 'Edit Budget Plan'}</h3>
                    <button type="button" onClick={closeForm} className="p-2 rounded-full bg-slate-100 dark:bg-black/20 hover:bg-rose-100 hover:text-rose-500 transition-colors"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Budget Name</label>
                        <input type="text" autoFocus placeholder="e.g. Holiday Fund" className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-emerald-900/30 focus:border-emerald-500 outline-none font-bold text-emerald-900 dark:text-emerald-100 text-sm transition-all" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Icon</label>
                        <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-2xl border border-slate-100 dark:border-emerald-900/30 grid grid-cols-5 gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                            {availableIcons.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button 
                                        key={item.name}
                                        type="button"
                                        onClick={() => setSelectedIcon(item.name)}
                                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${selectedIcon === item.name ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white dark:hover:bg-emerald-900/30'}`}
                                    >
                                        <Icon size={20}/>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                        <input type="text" placeholder="What is this for?" className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-emerald-900/30 focus:border-emerald-500 outline-none font-bold text-emerald-900 dark:text-emerald-100 text-sm transition-all" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Default Limit</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currency}</span>
                                <input type="number" placeholder="0" className="w-full p-3.5 pl-8 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-emerald-900/30 focus:border-emerald-500 outline-none font-bold text-emerald-900 dark:text-emerald-100 text-sm transition-all" value={initialBudget} onChange={(e) => setInitialBudget(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <SelectSheet label="Timeline" value={timeline} options={timelineOptions} onChange={(val) => setTimeline(val)} title="Select Timeline" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={closeForm} className="flex-1 p-3 bg-slate-100 dark:bg-black/20 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button type="submit" disabled={!name.trim()} className="flex-[2] p-3 bg-emerald-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">{formState.mode === 'create' ? 'Create Budget' : 'Update Budget'}</button>
                    </div>
                </div>
            </form>
         </div>
      )}

      <div className="pt-12 px-6 pb-4 shrink-0 text-center relative">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-white dark:border-emerald-800/50">
                <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-14 h-14 rounded-full" />
            </div>
            <h1 className="text-2xl font-black text-emerald-950 dark:text-emerald-50 mb-1">Welcome back, {userName}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Select a Budget to manage</p>
            
            {customContexts.length > 0 && !formState && (
                <button 
                    onClick={() => setIsEditingList(!isEditingList)}
                    className={`absolute top-12 right-6 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${isEditingList ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-black/20 text-slate-500 hover:text-emerald-600'}`}
                >
                    {isEditingList ? <Check size={14}/> : <Edit2 size={14}/>}
                    {isEditingList ? 'Done' : 'Edit'}
                </button>
            )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        <div className="w-full max-w-sm mx-auto space-y-4 py-4">
            
            {customContexts.map(ctx => renderCard(ctx))}

            {!formState && !isEditingList && (
                <button 
                    onClick={() => openForm('create')}
                    className="w-full p-4 rounded-[2rem] border-2 border-dashed border-slate-300 dark:border-emerald-900/50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all active:scale-[0.98]"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-black/20 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-emerald-900/30 transition-colors">
                        <Plus size={24} className="text-slate-400 group-hover:text-emerald-600"/>
                    </div>
                    <span className="font-bold text-sm">Create New Budget</span>
                </button>
            )}
        </div>
      </div>

      <div className="p-6 text-center shrink-0 bg-gradient-to-t from-emerald-50 dark:from-[#021c17] to-transparent">
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
            Emerald Finance v1.2.0
        </p>
      </div>
    </div>
  );
};
