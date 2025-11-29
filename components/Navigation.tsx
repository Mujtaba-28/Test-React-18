import React from 'react';
import { Home, PieChart, Compass, User, Plus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button 
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-300 ${isActive ? 'text-emerald-600 -translate-y-1' : 'text-slate-400 hover:text-emerald-600'}`}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}

interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onAddClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onAddClick }) => {
    return (
        <div className="absolute bottom-8 left-6 right-6 h-20 bg-white/90 dark:bg-[#022c22]/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/50 dark:border-emerald-700/30 flex items-center justify-around px-2 z-30 animate-in slide-in-from-bottom-6 duration-700 max-w-md mx-auto">
            <NavButton icon={Home} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButton icon={PieChart} label="Analytics" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            <div className="w-16 h-16 -mt-12">
                <button onClick={onAddClick} aria-label="Add Transaction" className="w-full h-full rounded-full bg-gradient-to-b from-emerald-400 to-teal-600 shadow-lg flex items-center justify-center text-white border-[6px] border-[#f0fdf4] dark:border-[#062c26] active:scale-95 transition-transform hover:scale-105">
                <Plus size={32} strokeWidth={3} />
                </button>
            </div>
            <NavButton icon={Compass} label="Plan" isActive={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
            <NavButton icon={User} label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
    );
}