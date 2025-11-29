
import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Lock, Unlock, HelpCircle, ScanFace } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useFinance } from '../../contexts/FinanceContext';
import { registerBiometric, isBiometricAvailable } from '../../utils/security';

interface SettingsModalProps {
  onClose: () => void;
  onOpenTutorial: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenTutorial }) => {
    const { isDark, toggleTheme, currency, setCurrency } = useTheme();
    const { userName } = useFinance();
    
    const [hasPin, setHasPin] = useState(false);
    const [bioActive, setBioActive] = useState(false);
    const [bioAvailable, setBioAvailable] = useState(false);
    
    const [mode, setMode] = useState<'view' | 'set' | 'change' | 'remove'>('view');
    const [step, setStep] = useState<'verify' | 'new' | 'confirm'>('new');
    const [inputPin, setInputPin] = useState('');
    
    useEffect(() => {
        const storedPin = localStorage.getItem('emerald_pin');
        setHasPin(!!storedPin);
        setBioActive(localStorage.getItem('emerald_biometric_active') === 'true');
        
        isBiometricAvailable().then(setBioAvailable);
    }, []);
    
    const currencies = [ { symbol: '₹', name: 'INR' }, { symbol: '$', name: 'USD' }, { symbol: '€', name: 'EUR' }, { symbol: '£', name: 'GBP' } ];
    
    const handlePinInput = (num: string) => {
        if (inputPin.length < 4) {
            setInputPin(prev => prev + num);
        }
    };

    const processPinAction = () => {
        if (inputPin.length !== 4) return;

        const storedPin = localStorage.getItem('emerald_pin');

        if (mode === 'set') {
            localStorage.setItem('emerald_pin', inputPin);
            setHasPin(true);
            setMode('view');
        } else if (mode === 'change') {
            if (step === 'verify') {
                if (inputPin === storedPin) {
                    setStep('new');
                    setInputPin('');
                } else {
                    alert('Incorrect Old PIN');
                    setInputPin('');
                }
            } else if (step === 'new') {
                localStorage.setItem('emerald_pin', inputPin);
                setMode('view');
            }
        } else if (mode === 'remove') {
             if (inputPin === storedPin) {
                 localStorage.removeItem('emerald_pin');
                 localStorage.removeItem('emerald_biometric_active'); // Disable bio if pin removed
                 setHasPin(false);
                 setBioActive(false);
                 setMode('view');
             } else {
                 alert('Incorrect PIN');
                 setInputPin('');
             }
        }
    };

    const toggleBiometric = async () => {
        if (!hasPin) {
            alert("Please set a PIN first.");
            return;
        }

        if (bioActive) {
            localStorage.removeItem('emerald_biometric_active');
            setBioActive(false);
        } else {
            const success = await registerBiometric(userName);
            if (success) {
                setBioActive(true);
            } else {
                alert("Failed to register Biometrics. Ensure your device supports FaceID/TouchID.");
            }
        }
    };

    const renderPinPad = (title: string, actionLabel: string) => (
        <div className="p-6 text-center animate-in zoom-in-95">
            <h4 className="font-bold mb-4 dark:text-emerald-50">{title}</h4>
            <div className="flex justify-center gap-2 mb-6">
                {[0,1,2,3].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < inputPin.length ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9,0].map(n => (
                    <button key={n} onClick={() => handlePinInput(n.toString())} className="p-3 rounded-xl bg-slate-50 dark:bg-black/20 font-bold dark:text-white hover:bg-emerald-50 transition-colors">{n}</button>
                ))}
                <button onClick={() => { setMode('view'); setInputPin(''); setStep('new'); }} className="col-span-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">Cancel</button>
            </div>
            <button onClick={processPinAction} disabled={inputPin.length !== 4} className="w-full p-3 bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50">{actionLabel}</button>
        </div>
    );

    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onClose} aria-label="Close Settings" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="opacity-60 text-emerald-900 dark:text-emerald-100" />
                    </button>
                    <span className="font-bold text-emerald-950 dark:text-emerald-50">Settings</span>
                    <div className="w-10"></div>
                </div>
                <div className="space-y-6">
                    
                    <button 
                        onClick={onOpenTutorial}
                        className="w-full p-4 bg-white dark:bg-[#0a3831] rounded-2xl border border-emerald-50 dark:border-emerald-800/30 flex items-center justify-between group active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <HelpCircle size={20}/>
                            </div>
                            <span className="font-bold text-emerald-950 dark:text-emerald-50">Help & Guide</span>
                        </div>
                    </button>

                    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0a3831] rounded-2xl border border-emerald-50 dark:border-emerald-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                {isDark ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-amber-500"/>}
                            </div>
                            <span className="font-bold text-emerald-950 dark:text-emerald-50">Dark Mode</span>
                        </div>
                        <button onClick={toggleTheme} aria-label="Toggle Dark Mode" className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${isDark ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#0a3831] rounded-2xl border border-emerald-50 dark:border-emerald-800/30 overflow-hidden">
                        {mode === 'view' && (
                            <div className="p-4 space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-xl ${hasPin ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {hasPin ? <Lock size={20}/> : <Unlock size={20}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-950 dark:text-emerald-50">App Lock</h4>
                                            <p className="text-xs text-slate-400">{hasPin ? 'PIN Active' : 'No PIN Set'}</p>
                                        </div>
                                    </div>
                                    {hasPin ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => { setMode('change'); setStep('verify'); setInputPin(''); }} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">Change PIN</button>
                                            <button onClick={() => { setMode('remove'); setInputPin(''); }} className="flex-1 py-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-xs font-bold text-rose-500">Remove</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setMode('set'); setInputPin(''); }} className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">Set PIN</button>
                                    )}
                                </div>

                                {hasPin && bioAvailable && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-emerald-900/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                                                    <ScanFace size={20}/>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-emerald-950 dark:text-emerald-50 text-sm">FaceID / TouchID</h4>
                                                    <p className="text-xs text-slate-400">Faster unlock</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={toggleBiometric}
                                                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${bioActive ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}
                                            >
                                                <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {mode === 'set' && renderPinPad('Set 4-Digit PIN', 'Save PIN')}
                        {mode === 'change' && step === 'verify' && renderPinPad('Enter Old PIN', 'Verify')}
                        {mode === 'change' && step === 'new' && renderPinPad('Enter New PIN', 'Update PIN')}
                        {mode === 'remove' && renderPinPad('Enter PIN to Remove', 'Remove Lock')}
                    </div>

                    <div>
                        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100 mb-3 ml-2">Currency</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {currencies.map(c => (
                                <button key={c.name} onClick={() => setCurrency(c.symbol)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${currency === c.symbol ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-[#0a3831] text-slate-500 dark:text-slate-400 border-emerald-50 dark:border-emerald-800/30'}`}>
                                    <span className="text-xl font-bold">{c.symbol}</span>
                                    <span className="text-[10px] font-bold opacity-70">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};
