import React from 'react';
import { Transaction } from '../types';
import { getCategoryDetails } from '../constants';
import { formatDate } from '../utils';

interface TransactionItemProps {
  tx: Transaction;
  onClick: (tx: Transaction) => void;
  currency: string;
  isPrivacyMode: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onClick, currency, isPrivacyMode }) => {
    const catDetails = getCategoryDetails(tx.category, tx.type);
    const Icon = catDetails.icon;
    const colorClass = catDetails.color;

    return (
        <div 
            onClick={() => onClick(tx)}
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0a3831] border border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group cursor-pointer active:scale-95 duration-200 shadow-sm"
        >
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                 <Icon size={20} strokeWidth={2.5} />
              </div>
              <div>
                 <h4 className="font-bold text-emerald-950 dark:text-emerald-50 text-sm group-hover:text-emerald-700 transition-colors">{tx.title}</h4>
                 <p className="text-xs text-emerald-900/40 dark:text-emerald-100/40 font-medium">{tx.category} • {formatDate(tx.date)}</p>
              </div>
           </div>
           <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {tx.type === 'income' ? '+' : '-'}{isPrivacyMode ? '****' : `${currency}${Math.abs(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
           </span>
        </div>
    )
};