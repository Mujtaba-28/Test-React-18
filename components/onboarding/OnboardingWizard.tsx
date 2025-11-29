
import React, { useState, useEffect } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronRight, Check, Sparkles, Shield, LayoutGrid, User, ArrowRight, ArrowLeft, PartyPopper } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
    const { completeOnboarding } = useFinance();
    const { setCurrency, currency } = useTheme();
    
    const [step, setStep] = useState(1);
    
    const [name, setName] = useState('');
    const [shouldWipe, setShouldWipe] = useState(true);
    const [budget, setBudget] = useState('');
    const [isCelebrating, setIsCelebrating] = useState(false);

    const [taglineIndex, setTaglineIndex] = useState(0);
    const [tourIndex, setTourIndex] = useState(0);

    const currencies = [ '₹', '$', '€', '£', 'AED', '¥' ];
    const taglines = ["Track Expenses", "Plan Goals", "Stay Private", "Build Wealth"];
    const quickBudgets = ["10000", "25000", "50000", "100000"];

    useEffect(() => {
        if (step === 1) {
            const interval = setInterval(() => {
                setTaglineIndex(prev => (prev + 1) % taglines.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [step]);

    const tourSteps = [
        {
            title: "Smart AI Entry",
            desc: "Snap a receipt or paste a text. Our AI fills in the details for you automatically.",
            icon: Sparkles,
            color: "indigo"
        },
        {
            title: "Private & Secure",
            desc: "Your financial data stays on your device. Offline-first and encrypted locally.",
            icon: Shield,
            color: "emerald"
        },
        {
            title: "Visual Analytics",
            desc: "Beautiful charts and predictive insights to help you save more every month.",
            icon: LayoutGrid,
            color: "teal"
        }
    ];

    const handleNext = () => {
        if (step === 2) {
            if (tourIndex < tourSteps.length - 1) {
                setTourIndex(prev => prev + 1);
                return;
            }
        }
        if (step === 3 && !name.trim()) return;
        if (step < 4) setStep(step + 1);
        else {
            handleLaunch();
        }
    };

    const handleBack = () => {
        if (step === 2 && tourIndex > 0) {
            setTourIndex(prev => prev - 1);
            return;
        }
        if (step > 1) setStep(step - 1);
    };

    const handleLaunch = () => {
        setIsCelebrating(true);
        setTimeout(() => {
            completeOnboarding(name, shouldWipe, shouldWipe ? (parseFloat(budget) || 0) : 0);
        }, 2200);
    };

    if (isCelebrating) {
        return (
            <div className="fixed inset-0 z-[200] bg-emerald-600 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 text-white">
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse"></div>
                    <div className="relative bg-white text-emerald-600 p-8 rounded-full shadow-2xl animate-in zoom-in duration-700 ease-out flex items-center justify-center">
                        <Check size={64} strokeWidth={4} />
                    </div>
                </div>
                <h2 className="text-3xl font-black mt-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">You're All Set!</h2>
                <p className="text-emerald-100 font-medium mt-2 animate-in slide-in-from-bottom-8 duration-700 delay-300">Welcome to Emerald Finance</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-[#021c17] dark:via-[#032b24] dark:to-[#021c17] flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm relative flex flex-col h-full max-h-[700px] justify-center">
                
                {step > 1 && (
                    <button onClick={handleBack} className="absolute top-0 left-0 p-3 rounded-full hover:bg-white/20 text-slate-500 dark:text-emerald-100 transition-colors z-50 active:scale-90"><ArrowLeft size={24} /></button>
                )}

                {step === 1 && (
                    <div className="text-center animate-in zoom-in duration-700 flex flex-col items-center">
                        <div className="w-32 h-32 bg-emerald-100/50 backdrop-blur-sm rounded-[2.5rem] mb-8 flex items-center justify-center shadow-2xl shadow-emerald-500/20 ring-4 ring-white/50 animate-[pulse_3s_infinite]">
                             <img src="https://api.dicebear.com/9.x/shapes/svg?seed=Emerald&backgroundColor=10b981" className="w-20 h-20 drop-shadow-md"/>
                        </div>
                        <h1 className="text-5xl font-black text-emerald-950 dark:text-emerald-50 mb-4 tracking-tighter">Emerald</h1>
                        
                        <div className="h-8 mb-12 overflow-hidden relative w-full">
                            {taglines.map((tag, i) => (
                                <p key={i} className={`absolute w-full text-lg font-bold text-slate-500 dark:text-emerald-200/80 transition-all duration-500 transform ${i === taglineIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>{tag}</p>
                            ))}
                        </div>

                        <button onClick={handleNext} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/30 active:scale-95 transition-all hover:shadow-xl flex items-center justify-center gap-2 group">Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></button>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white/80 dark:bg-[#0a3831]/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-white/40 dark:border-emerald-500/10 h-[520px] flex flex-col items-center text-center animate-in slide-in-from-right-8 duration-500 relative overflow-hidden transition-all">
                        <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                            {tourSteps.map((s, idx) => (
                                idx === tourIndex && (
                                    <div key={idx} className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col items-center">
                                        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-${s.color}-500/30 blur-[70px] rounded-full animate-pulse pointer-events-none`}></div>
                                        <div className="relative w-40 h-40 mb-8 perspective-1000">
                                            <div className={`w-full h-full rounded-[2.5rem] bg-gradient-to-br from-white/80 to-white/30 dark:from-white/10 dark:to-white/5 border border-white/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-center backdrop-blur-2xl transition-transform duration-500 hover:scale-105 hover:rotate-3`}>
                                                <s.icon size={70} strokeWidth={1.5} className={`text-${s.color}-600 dark:text-${s.color}-400 drop-shadow-sm`}/>
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-[#021c17] rounded-full flex items-center justify-center shadow-sm">
                                                    <div className={`w-2.5 h-2.5 bg-${s.color}-500 rounded-full animate-ping`}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight relative z-10 leading-tight">{s.title}</h2>
                                        <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-medium text-base px-1 relative z-10">{s.desc}</p>
                                    </div>
                                )
                            ))}
                        </div>
                        <div className="w-full relative z-20 mt-4">
                            <div className="flex justify-center gap-3 mb-6">
                                {tourSteps.map((_, i) => (
                                    <button key={i} onClick={() => setTourIndex(i)} className={`h-2 rounded-full transition-all duration-500 ease-out ${i === tourIndex ? 'w-8 bg-emerald-500 shadow-md' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-emerald-200'}`} />
                                ))}
                            </div>
                            <button onClick={handleNext} className="w-full py-4 bg-emerald-950 dark:bg-emerald-100 text-white dark:text-emerald-950 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
                                {tourIndex === tourSteps.length - 1 ? 'Next Step' : 'Continue'} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white/80 dark:bg-[#0a3831]/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-white/40 dark:border-emerald-500/10 animate-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">About You</h2>
                            <p className="text-slate-400 text-sm mt-1">{name ? `Nice to meet you, ${name.split(' ')[0]}!` : 'Let\'s set up your profile'}</p>
                        </div>
                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 ml-1 transition-all">What should we call you?</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"><User size={20}/></div>
                                    <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 p-4 pl-12 rounded-2xl font-bold text-lg outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:bg-white dark:focus:bg-black/40 transition-all placeholder:text-slate-300 placeholder:font-normal" autoFocus />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Primary Currency</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {currencies.map(c => (
                                        <button key={c} onClick={() => setCurrency(c)} className={`p-4 rounded-2xl font-bold text-xl transition-all duration-300 ${currency === c ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105 ring-2 ring-emerald-600 ring-offset-2 ring-offset-white dark:ring-offset-[#0a3831]' : 'bg-slate-50 dark:bg-black/20 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600'}`}>{c}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleNext} disabled={!name.trim()} className="w-full mt-8 py-4 bg-emerald-950 dark:bg-emerald-100 text-white dark:text-emerald-950 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all active:scale-[0.98]">Continue</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="bg-white/80 dark:bg-[#0a3831]/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-white/40 dark:border-emerald-500/10 animate-in slide-in-from-right-8 duration-500 overflow-y-auto max-h-[600px] scrollbar-hide">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Data Setup</h2>
                            <p className="text-slate-400 text-sm mt-1">Choose how you want to start</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button onClick={() => setShouldWipe(true)} className={`p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 border-2 ${shouldWipe ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md' : 'bg-slate-50 dark:bg-black/20 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${shouldWipe ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><Check size={14} strokeWidth={4}/></div>
                                <span className="font-bold text-sm">Start Fresh</span>
                            </button>
                            <button onClick={() => setShouldWipe(false)} className={`p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 border-2 ${!shouldWipe ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-black/20 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${!shouldWipe ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-transparent'}`}><Check size={14} strokeWidth={4}/></div>
                                <span className="font-bold text-sm">Demo Data</span>
                            </button>
                        </div>

                        {shouldWipe ? (
                            <div className="animate-in slide-in-from-bottom-2 fade-in">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Monthly Budget Target</label>
                                <div className="relative mb-4">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">{currency}</span>
                                    <input type="number" placeholder="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 p-4 pl-10 rounded-2xl font-black text-3xl outline-none text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-200" autoFocus />
                                </div>
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2">
                                    {quickBudgets.map(amt => (
                                        <button key={amt} onClick={() => setBudget(amt)} className="px-3 py-2 bg-slate-100 dark:bg-black/30 rounded-xl text-xs font-bold text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors whitespace-nowrap">{currency}{parseInt(amt).toLocaleString()}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl mb-4 border border-indigo-100 dark:border-indigo-800/30 animate-in slide-in-from-bottom-2">
                                <div className="flex gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 h-fit"><LayoutGrid size={20}/></div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Demo Mode</h4>
                                        <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-1 leading-relaxed">We'll load sample data so you can explore immediately.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button onClick={handleNext} disabled={shouldWipe && !budget} className="w-full mt-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/30 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">Launch App <PartyPopper size={20} className="group-hover:-rotate-12 transition-transform"/></button>
                    </div>
                )}
                
                {step > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {[2,3,4].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ease-out ${step >= i ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300/50 dark:bg-slate-700'}`}></div>)}
                    </div>
                )}
            </div>
        </div>
    );
};
