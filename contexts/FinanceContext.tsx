
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Transaction, BudgetMap, Subscription, Goal, Debt, BackupData, BudgetContext, ContextMetadata } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_SUBSCRIPTIONS, INITIAL_GOALS, INITIAL_DEBTS } from '../constants';
import { saveAttachment, deleteAttachment, clearDB, getAllAttachments, restoreAttachments } from '../utils/db';
import { calculateNextDate, shareFile } from '../utils';

interface FinanceContextType {
  // State
  userName: string;
  activeContext: BudgetContext;
  customContexts: ContextMetadata[];
  transactions: Transaction[]; // Filtered by activeContext
  budgets: BudgetMap;
  subscriptions: Subscription[]; // Filtered
  goals: Goal[]; // Filtered
  debts: Debt[]; // Filtered
  dataError: boolean;
  isOnboarded: boolean;
  lastBackupDate: string | null;
  lastCloudSync: string | null;
  
  // Actions
  setUserName: (name: string) => void;
  setActiveContext: (ctx: BudgetContext) => void;
  addContext: (name: string, initialBudget?: number, description?: string, timeline?: string, icon?: string) => void;
  updateContext: (id: string, updates: { name?: string; description?: string; timeline?: any; initialBudget?: number; icon?: string }) => void;
  deleteContext: (id: string) => void;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  importTransactions: (txs: Transaction[]) => void;
  
  updateBudget: (amount: number, monthKey: string, category?: string) => void;
  
  addSubscription: (sub: Subscription) => void;
  updateSubscription: (sub: Subscription) => void;
  deleteSubscription: (id: string) => void;
  
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  
  addDebt: (debt: Debt) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;

  resetData: () => Promise<void>;
  createBackup: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  restoreBackup: (file: File) => Promise<void>;
  completeOnboarding: (name: string, clearData?: boolean, initialBudget?: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
    ]);
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataError, setDataError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');
  const [activeContext, setActiveContext] = useState<BudgetContext>('personal');
  const [customContexts, setCustomContexts] = useState<ContextMetadata[]>([]);

  // Raw State (Holds All Data)
  const [allTransactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [allBudgets, setBudgets] = useState<BudgetMap>(INITIAL_BUDGETS);
  const [allSubscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [allGoals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [allDebts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);

  // Derived State (Filtered by Context)
  const transactions = useMemo(() => allTransactions.filter(t => (t.context || 'personal') === activeContext), [allTransactions, activeContext]);
  const subscriptions = useMemo(() => allSubscriptions.filter(s => (s.context || 'personal') === activeContext), [allSubscriptions, activeContext]);
  const goals = useMemo(() => allGoals.filter(g => (g.context || 'personal') === activeContext), [allGoals, activeContext]);
  const debts = useMemo(() => allDebts.filter(d => (d.context || 'personal') === activeContext), [allDebts, activeContext]);
  
  // --- AUTO PAY LOGIC ---
  useEffect(() => {
      if (isInitialized && allSubscriptions.length > 0) {
          const today = new Date();
          today.setHours(0,0,0,0);
          
          let subUpdates: Subscription[] = [];
          let newTxs: Transaction[] = [];

          allSubscriptions.forEach(sub => {
              if (sub.autoPay) {
                  const dueDate = new Date(sub.nextBillingDate);
                  dueDate.setHours(0,0,0,0);
                  
                  if (dueDate <= today) {
                      newTxs.push({
                          id: Date.now() + Math.random(),
                          title: sub.name,
                          amount: sub.amount,
                          category: sub.category || 'Bills',
                          date: new Date().toISOString(),
                          type: 'expense',
                          context: sub.context || 'personal'
                      });
                      
                      const nextDate = calculateNextDate(sub.nextBillingDate, sub.billingCycle);
                      subUpdates.push({ ...sub, nextBillingDate: nextDate });
                  }
              }
          });

          if (newTxs.length > 0) {
              setTransactions(prev => [...newTxs, ...prev]);
              setSubscriptions(prev => prev.map(s => {
                  const updated = subUpdates.find(u => u.id === s.id);
                  return updated || s;
              }));
          }
      }
  }, [isInitialized]);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadData = () => {
        try {
            if (typeof window === 'undefined') return;
            const onboarded = localStorage.getItem('emerald_onboarded');
            if (onboarded) setIsOnboarded(JSON.parse(onboarded));
            const storedName = localStorage.getItem('emerald_user_name');
            if (storedName) setUserName(storedName);
            const backupDate = localStorage.getItem('emerald_last_backup');
            if (backupDate) setLastBackupDate(backupDate);
            const syncDate = localStorage.getItem('emerald_last_cloud_sync');
            if (syncDate) setLastCloudSync(syncDate);
            const savedCtx = localStorage.getItem('emerald_active_context');
            if (savedCtx) setActiveContext(savedCtx as BudgetContext);
            
            const savedCustomContexts = localStorage.getItem('emerald_custom_contexts');
            let loadedContexts: ContextMetadata[] = [];

            if (savedCustomContexts) {
                const parsed = JSON.parse(savedCustomContexts);
                if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
                    loadedContexts = parsed.map((c: string) => ({
                        id: c,
                        name: c,
                        timeline: 'monthly',
                        type: 'custom',
                        icon: 'Folder'
                    }));
                } else {
                    loadedContexts = parsed;
                }
            }

            // Migration: Ensure defaults exist IF NOT starting fresh (handled by completeOnboarding logic normally)
            // But on initial load, if empty, we populate.
            if (loadedContexts.length === 0 && !onboarded) {
                 const defaults: ContextMetadata[] = [
                    { id: 'personal', name: 'Personal Budget', description: 'Daily expenses', timeline: 'monthly', type: 'personal', icon: 'User' },
                    { id: 'business', name: 'Business Budget', description: 'Work expenses', timeline: 'monthly', type: 'business', icon: 'Briefcase' }
                ];
                loadedContexts = defaults;
            } else if (loadedContexts.length === 0 && onboarded) {
                // Should not happen, but safe fallback
                 loadedContexts = [{ id: 'personal', name: 'Personal', timeline: 'monthly', type: 'personal', icon: 'User' }];
            }

            setCustomContexts(loadedContexts);

            const txRaw = localStorage.getItem('emerald_transactions');
            if (txRaw) setTransactions(JSON.parse(txRaw));
            const budgetsRaw = localStorage.getItem('emerald_budgets');
            if (budgetsRaw) setBudgets(JSON.parse(budgetsRaw));
            const subsRaw = localStorage.getItem('emerald_subscriptions');
            if (subsRaw) setSubscriptions(JSON.parse(subsRaw));
            const goalsRaw = localStorage.getItem('emerald_goals');
            if (goalsRaw) setGoals(JSON.parse(goalsRaw));
            const debtsRaw = localStorage.getItem('emerald_debts');
            if (debtsRaw) setDebts(JSON.parse(debtsRaw));

            setIsInitialized(true);
        } catch (e) {
            console.error("Data Corruption", e);
            setDataError(true);
        }
    };
    loadData();
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => { if (isInitialized) localStorage.setItem('emerald_user_name', userName); }, [userName, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('emerald_active_context', activeContext); }, [activeContext, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('emerald_custom_contexts', JSON.stringify(customContexts)); }, [customContexts, isInitialized]);
  useEffect(() => { if (isInitialized && !dataError) localStorage.setItem('emerald_budgets', JSON.stringify(allBudgets)); }, [allBudgets, isInitialized, dataError]);
  useEffect(() => { 
      if (isInitialized && !dataError) {
          const safeTransactions = allTransactions.map(t => {
              const { attachment, ...rest } = t; 
              return rest;
          });
          localStorage.setItem('emerald_transactions', JSON.stringify(safeTransactions)); 
      }
  }, [allTransactions, isInitialized, dataError]);
  useEffect(() => { if (isInitialized && !dataError) localStorage.setItem('emerald_subscriptions', JSON.stringify(allSubscriptions)); }, [allSubscriptions, isInitialized, dataError]);
  useEffect(() => { if (isInitialized && !dataError) localStorage.setItem('emerald_goals', JSON.stringify(allGoals)); }, [allGoals, isInitialized, dataError]);
  useEffect(() => { if (isInitialized && !dataError) localStorage.setItem('emerald_debts', JSON.stringify(allDebts)); }, [allDebts, isInitialized, dataError]);
  useEffect(() => { if (isInitialized && !dataError) localStorage.setItem('emerald_onboarded', JSON.stringify(isOnboarded)); }, [isOnboarded, isInitialized, dataError]);

  // --- ACTIONS ---
  
  const completeOnboarding = (name: string, clearData = false, initialBudget = 0) => {
      setUserName(name);
      
      if (clearData) {
          // WIPE MODE: Remove everything
          setTransactions([]);
          setSubscriptions([]);
          setGoals([]);
          setDebts([]);
          
          // Re-initialize contexts to ONLY Personal (clean state)
          const cleanContexts: ContextMetadata[] = [
              { id: 'personal', name: 'Personal Budget', description: 'Main Budget', timeline: 'monthly', type: 'personal', icon: 'User' }
          ];
          setCustomContexts(cleanContexts);
          setActiveContext('personal');

          // Set Initial Budget for the clean Personal context
          if (initialBudget > 0) {
              setBudgets({ 'personal-default': initialBudget });
          } else {
              setBudgets({});
          }
      } else {
          // DEMO MODE: Keep defaults but set budget if provided
          if (initialBudget > 0) {
              setBudgets(prev => ({ ...prev, 'personal-default': initialBudget }));
          }
      }
      setIsOnboarded(true);
  };

  const addContext = (name: string, initialBudget: number = 0, description: string = '', timeline: string = 'monthly', icon: string = 'Folder') => {
      const id = Date.now().toString();
      
      if (!customContexts.some(c => c.name.toLowerCase() === name.toLowerCase())) {
          const newContext: ContextMetadata = {
              id,
              name,
              description,
              timeline: timeline as any,
              type: 'custom',
              icon
          };
          setCustomContexts(prev => [...prev, newContext]);
          
          if (initialBudget > 0) {
              setBudgets(prev => ({ ...prev, [`${id}-default`]: initialBudget }));
          }
      }
  };

  const updateContext = (id: string, updates: { name?: string; description?: string; timeline?: any; initialBudget?: number; icon?: string }) => {
    setCustomContexts(prev => prev.map(ctx => {
        if (ctx.id === id) {
            return {
                ...ctx,
                name: updates.name ?? ctx.name,
                description: updates.description ?? ctx.description,
                timeline: updates.timeline ?? ctx.timeline,
                icon: updates.icon ?? ctx.icon,
            };
        }
        return ctx;
    }));

    if (updates.initialBudget !== undefined) {
        const budgetKey = `${id}-default`;
        setBudgets(prev => ({ ...prev, [budgetKey]: updates.initialBudget || 0 }));
    }
  };

  const deleteContext = (id: string) => {
      if (customContexts.length <= 1) {
          alert("You must have at least one active budget.");
          return;
      }

      const updatedContexts = customContexts.filter(c => c.id !== id);
      setCustomContexts(updatedContexts);
      
      if (activeContext === id) {
          setActiveContext(updatedContexts[0].id);
      }

      setTransactions(prev => prev.filter(t => t.context !== id));
      setSubscriptions(prev => prev.filter(s => s.context !== id));
      setGoals(prev => prev.filter(g => g.context !== id));
      setDebts(prev => prev.filter(d => d.context !== id));
      
      setBudgets(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
              if (key.startsWith(`${id}-`)) delete next[key];
          });
          return next;
      });
  };

  const addTransaction = async (tx: Transaction) => {
      if (tx.attachment) await saveAttachment(tx.id, tx.attachment);
      const optimizedTx = { ...tx, attachment: undefined, hasAttachment: !!tx.attachment, context: activeContext };
      setTransactions(prev => [optimizedTx, ...prev]);
  };

  const updateTransaction = async (tx: Transaction) => {
      if (tx.attachment) await saveAttachment(tx.id, tx.attachment);
      const optimizedTx = { ...tx, attachment: undefined, hasAttachment: !!tx.attachment || !!tx.hasAttachment };
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...optimizedTx, context: t.context || activeContext } : t));
  };

  const deleteTransaction = async (id: number) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      try { await withTimeout(deleteAttachment(id), 500); } catch (e) {}
  };

  const importTransactions = (txs: Transaction[]) => {
      const taggedTxs = txs.map(t => ({ ...t, context: activeContext }));
      setTransactions(prev => [...taggedTxs, ...prev]);
  };

  const updateBudget = (amount: number, monthKey: string, category?: string) => {
      const prefix = activeContext;
      const cleanMonthKey = monthKey.replace(/^(personal|business|.*)-(\d{4}-\d{2})$/, '$2');
      const finalKey = `${prefix}-${cleanMonthKey}`;

      if (category) {
          setBudgets(prev => ({ ...prev, [`${finalKey}-category-${category}`]: amount }));
      } else {
          setBudgets(prev => ({ ...prev, [finalKey]: amount }));
      }
  };

  const addSubscription = (sub: Subscription) => setSubscriptions(prev => [...prev, { ...sub, context: activeContext }]);
  const updateSubscription = (sub: Subscription) => setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...sub, context: s.context || activeContext } : s));
  const deleteSubscription = (id: string) => setSubscriptions(prev => prev.filter(s => s.id !== id));

  const addGoal = (goal: Goal) => setGoals(prev => [...prev, { ...goal, context: activeContext }]);
  const updateGoal = (goal: Goal) => setGoals(prev => prev.map(g => g.id === goal.id ? { ...goal, context: g.context || activeContext } : g));
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const addDebt = (debt: Debt) => setDebts(prev => [...prev, { ...debt, context: activeContext }]);
  const updateDebt = (debt: Debt) => setDebts(prev => prev.map(d => d.id === debt.id ? { ...debt, context: d.context || activeContext } : d));
  const deleteDebt = (id: string) => setDebts(prev => prev.filter(d => d.id !== id));

  const resetData = async () => {
      localStorage.clear();
      try { await withTimeout(clearDB(), 1000); } catch (e) {}
      setTransactions([]); setBudgets({}); setSubscriptions([]); setGoals([]); setDebts([]);
      setUserName('User'); setLastBackupDate(null); setDataError(false); setIsOnboarded(false); setCustomContexts([]);
      if (typeof window !== 'undefined') {
          try { window.location.hash = ''; } catch (e) {}
      }
  };

  const createBackup = async () => {
      try {
          const attachments = await getAllAttachments();
          const backup: BackupData = {
              version: 1,
              timestamp: new Date().toISOString(),
              transactions: allTransactions,
              budgets: allBudgets,
              subscriptions: allSubscriptions,
              goals: allGoals,
              debts: allDebts,
              attachments,
              customContexts,
              theme: {
                  isDark: JSON.parse(localStorage.getItem('emerald_theme') || 'false'),
                  currency: localStorage.getItem('emerald_currency') || '₹'
              }
          };
          const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `emerald_backup_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          const now = new Date().toISOString();
          setLastBackupDate(now);
          localStorage.setItem('emerald_last_backup', now);
      } catch (e) { alert("Failed to create backup."); }
  };

  const syncToCloud = async () => {
      try {
          const attachments = await getAllAttachments();
          const backup: BackupData = {
              version: 1,
              timestamp: new Date().toISOString(),
              transactions: allTransactions,
              budgets: allBudgets,
              subscriptions: allSubscriptions,
              goals: allGoals,
              debts: allDebts,
              attachments,
              customContexts,
              theme: {
                  isDark: JSON.parse(localStorage.getItem('emerald_theme') || 'false'),
                  currency: localStorage.getItem('emerald_currency') || '₹'
              }
          };
          const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
          const file = new File([blob], `emerald_backup_${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
          
          const success = await shareFile(file, 'Emerald Backup', 'Backing up my financial data.');
          if (success) {
              const now = new Date().toISOString();
              setLastCloudSync(now);
              localStorage.setItem('emerald_last_cloud_sync', now);
          } else {
              createBackup();
              alert("Native sharing not supported. File downloaded instead.");
          }
      } catch (e) {
          alert("Failed to initiate cloud sync.");
      }
  };

  const restoreBackup = async (file: File) => {
      try {
          const text = await file.text();
          const data = JSON.parse(text) as BackupData;
          localStorage.clear();
          localStorage.setItem('emerald_transactions', JSON.stringify(data.transactions));
          localStorage.setItem('emerald_budgets', JSON.stringify(data.budgets));
          localStorage.setItem('emerald_subscriptions', JSON.stringify(data.subscriptions));
          localStorage.setItem('emerald_goals', JSON.stringify(data.goals));
          localStorage.setItem('emerald_debts', JSON.stringify(data.debts));
          localStorage.setItem('emerald_onboarded', 'true');
          localStorage.setItem('emerald_last_backup', new Date().toISOString());
          
          if (data.customContexts) localStorage.setItem('emerald_custom_contexts', JSON.stringify(data.customContexts));
          if (data.theme) {
              localStorage.setItem('emerald_theme', JSON.stringify(data.theme.isDark));
              localStorage.setItem('emerald_currency', data.theme.currency);
          }
          if (data.attachments) await restoreAttachments(data.attachments);
          else await clearDB();
          window.location.reload();
      } catch (e) { alert("Failed to restore backup."); }
  };

  return (
    <FinanceContext.Provider value={{
      userName, setUserName, activeContext, setActiveContext, customContexts,
      transactions, budgets: allBudgets, subscriptions, goals, debts, dataError, isOnboarded, lastBackupDate, lastCloudSync,
      addTransaction, updateTransaction, deleteTransaction, importTransactions,
      updateBudget, addContext, updateContext, deleteContext,
      addSubscription, updateSubscription, deleteSubscription,
      addGoal, updateGoal, deleteGoal,
      addDebt, updateDebt, deleteDebt,
      resetData, createBackup, syncToCloud, restoreBackup, completeOnboarding
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
