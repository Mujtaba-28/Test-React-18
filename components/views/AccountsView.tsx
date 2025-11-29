
import React, { useRef, useState } from 'react';
import { Upload, Download, Settings, ChevronRight, Save, FolderOpen, FileText, Edit2, RefreshCw, Trash2, Check, Cloud } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { parseCSV, triggerHaptic, formatDate } from '../../utils';
import { generateMonthlyReport } from '../../utils/pdf';
import { Transaction } from '../../types';
import { ConfirmationModal } from '../modals/ConfirmationModal';

interface AccountsViewProps {
  onOpenSettings: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ onOpenSettings }) => {
    const { transactions, budgets, importTransactions, createBackup, syncToCloud, restoreBackup, userName, setUserName, lastBackupDate, lastCloudSync, resetData } = useFinance();
    const { currency } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backupInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const [avatarSeed, setAvatarSeed] = useState(userName);
    
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleSaveProfile = () => {
        if (tempName.trim()) {
            setUserName(tempName);
            triggerHaptic(20);
            setIsEditing(false);
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseCSV(text);
            if (parsed.length > 0) {
                const newTxs = parsed.map((p, idx) => ({
                    id: Date.now() + idx,
                    title: p.title || 'Imported',
                    category: p.category || 'Other',
                    amount: p.amount || 0,
                    date: p.date || new Date().toISOString(),
                    type: p.type || 'expense'
                } as Transaction));
                importTransactions(newTxs);
                alert(`Successfully imported ${newTxs.length} transactions.`);
                triggerHaptic(20);
            } else {
                alert('Failed to parse CSV. Please ensure it has valid headers.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (window.confirm("Restoring a backup will OVERWRITE all current data. Are you sure?")) {
                restoreBackup(file);
            }
        }
        e.target.value = '';
    };

    const handleGenerateReport = () => {
        generateMonthlyReport(transactions, budgets, new Date(), currency);
        triggerHaptic(10);
    };

    const handleResetApp = () => {
        triggerHaptic(10);
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        triggerHaptic(50);
        resetData();
        setShowResetConfirm(false);
    };

    const ListItem = ({ icon: Icon, label, subLabel, onClick, color = "emerald", danger = false }: any) => (
        <button 
            onClick={onClick}
            className={`w-full p-4 flex items-center justify-between group active:scale-[0.98] transition-all bg-white dark:bg-[#0a3831] first:rounded-t-2xl last:rounded-b-2xl border-b border-slate-100 dark:border-emerald-900/30 last:border-none`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' : `bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400`}`}>
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <h4 className={`font-bold text-sm ${danger ? 'text-rose-600' : 'text-emerald-950 dark:text-emerald-50'}`}>{label}</h4>
                    {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
                </div>
            </div>
            {!danger && <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />}
        </button>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6 max-w-md mx-auto pb-10">
            <ConfirmationModal 
                isOpen={showResetConfirm}
                title="Reset Application?"
                message="This will permanently delete ALL transactions, goals, debts, and settings. This cannot be undone."
                onConfirm={confirmReset}
                onCancel={() => setShowResetConfirm(false)}
                confirmText="Reset Everything"
            />

            <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50 px-2">Settings</h2>
            
            <div className="bg-white dark:bg-[#0a3831] p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden group mx-2">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-[#021c17] p-1 shadow-md">
                            <img 
                                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${isEditing ? avatarSeed : userName}&backgroundColor=b6e3f4`} 
                                alt="Avatar" 
                                className="w-full h-full rounded-full object-cover" 
                            />
                        </div>
                        {isEditing && (
                            <button 
                                onClick={() => { setAvatarSeed(Math.random().toString(36)); triggerHaptic(5); }}
                                className="absolute bottom-0 right-0 p-1.5 bg-indigo-500 text-white rounded-full shadow-lg"
                            >
                                <RefreshCw size={12} />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1">
                         {isEditing ? (
                            <div className="flex items-center gap-2 mb-2 animate-in zoom-in origin-left">
                                <input 
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-slate-100 dark:bg-black/30 px-3 py-1 rounded-xl font-bold text-lg outline-none border-2 border-emerald-500 w-full"
                                    autoFocus
                                />
                                <button onClick={handleSaveProfile} className="p-2 bg-emerald-500 text-white rounded-full shrink-0">
                                    <Check size={16} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                                        {userName}
                                    </h3>
                                    <p className="text-slate-400 text-xs font-medium">Local Account</p>
                                </div>
                                <button onClick={() => { setTempName(userName); setAvatarSeed(userName); setIsEditing(true); triggerHaptic(5); }} className="p-2 bg-slate-50 dark:bg-emerald-900/30 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2 px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">App Preferences</h3>
                <div className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                    <ListItem icon={Settings} label="App Settings" subLabel="Appearance, Currency & Security" onClick={onOpenSettings} color="indigo" />
                </div>
            </div>

            <div className="space-y-2 px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Data Management</h3>
                <div className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                    <ListItem 
                        icon={Cloud} 
                        label="Cloud Sync" 
                        subLabel={lastCloudSync ? `Synced: ${formatDate(lastCloudSync)}` : 'Save to Drive/iCloud'} 
                        onClick={() => { syncToCloud(); triggerHaptic(20); }} 
                        color="sky"
                    />
                    <ListItem 
                        icon={Save} 
                        label="Backup Data" 
                        subLabel={lastBackupDate ? `Last: ${formatDate(lastBackupDate)}` : 'Local file download'} 
                        onClick={() => { createBackup(); triggerHaptic(20); }} 
                        color="emerald"
                    />
                    <ListItem 
                        icon={FolderOpen} 
                        label="Restore Backup" 
                        subLabel="Import from JSON file" 
                        onClick={() => { backupInputRef.current?.click(); triggerHaptic(10); }} 
                        color="blue"
                    />
                    <input type="file" ref={backupInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />

                    <ListItem 
                        icon={FileText} 
                        label="Generate Report" 
                        subLabel="Download PDF Summary" 
                        onClick={handleGenerateReport} 
                        color="purple"
                    />
                    
                    <ListItem 
                        icon={Upload} 
                        label="Export CSV" 
                        subLabel="Raw data for Excel" 
                        onClick={() => triggerHaptic(10)} 
                        color="slate"
                    />

                    <ListItem 
                        icon={Download} 
                        label="Import CSV" 
                        subLabel="Add bulk transactions" 
                        onClick={() => { fileInputRef.current?.click(); triggerHaptic(10); }} 
                        color="slate"
                    />
                    <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".csv" className="hidden" />
                </div>
            </div>

            <div className="space-y-2 px-2">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest px-2">Danger Zone</h3>
                <div className="rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-900/30 shadow-sm">
                    <ListItem 
                        icon={Trash2} 
                        label="Reset Application" 
                        subLabel="Erase all data permanently" 
                        onClick={handleResetApp} 
                        danger={true} 
                    />
                </div>
            </div>

            <div className="text-center pt-6 pb-2">
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">
                    Emerald Finance v1.2.0 • Offline
                </p>
            </div>
        </div>
    )
};
