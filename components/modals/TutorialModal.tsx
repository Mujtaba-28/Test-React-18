
import React, { useState } from 'react';
import { X, Sparkles, Shield, Camera, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';

interface TutorialModalProps {
    onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
    const [openSection, setOpenSection] = useState<string | null>('ai');

    const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

    const GuideSection = ({ id, title, icon: Icon, color, children }: any) => (
        <div className="bg-white dark:bg-[#0a3831] rounded-2xl border border-emerald-100 dark:border-emerald-800/30 overflow-hidden">
            <button 
                onClick={() => toggle(id)} 
                className="w-full p-4 flex items-center justify-between text-left active:bg-slate-50 dark:active:bg-black/20"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                        <Icon size={20} />
                    </div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-50">{title}</span>
                </div>
                {openSection === id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
            </button>
            {openSection === id && (
                <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-emerald-900/30">
                    <div className="pt-3">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="absolute inset-0 z-[150] flex items-end sm:items-center justify-center bg-emerald-950/40 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#f0fdf4] dark:bg-[#062c26] rounded-[2.5rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="opacity-60 text-emerald-900 dark:text-emerald-100" />
                    </button>
                    <span className="font-bold text-emerald-950 dark:text-emerald-50">App Guide</span>
                    <div className="w-10"></div>
                </div>

                <div className="overflow-y-auto space-y-3 pb-4 scrollbar-hide">
                    <GuideSection id="ai" title="AI & Smart Entry" icon={Sparkles} color="indigo">
                        <p className="mb-3">Emerald's AI makes adding transactions effortless.</p>
                        <ul className="space-y-2 list-disc pl-4 opacity-80">
                            <li><strong>Receipt Scanning:</strong> Tap the Camera icon on the "New Transaction" screen. The AI extracts the merchant, date, and amount automatically.</li>
                            <li><strong>Text Paste:</strong> Tap the Sparkles icon and paste an SMS like "Spent 500 on dinner at McD". It fills the form for you.</li>
                            <li><strong>Chat Assistant:</strong> Use the Chat (Sparkles in header) to ask questions or command actions like "Add a goal for Vacation".</li>
                        </ul>
                    </GuideSection>

                    <GuideSection id="data" title="Data & Backups" icon={Shield} color="emerald">
                        <p className="mb-3">Your data lives 100% on your device for privacy. We don't see it.</p>
                        <ul className="space-y-2 list-disc pl-4 opacity-80">
                            <li><strong>Local Storage:</strong> Everything is saved to your phone's browser storage.</li>
                            <li><strong>Backups:</strong> Go to the <strong>Accounts</strong> tab and tap "Full Backup". This saves a JSON file.</li>
                            <li><strong>Restore:</strong> Use that file to move data to a new phone or browser.</li>
                            <li><strong>Health Check:</strong> The app will remind you if you haven't backed up in 7 days.</li>
                        </ul>
                    </GuideSection>

                    <GuideSection id="dashboard" title="Custom Dashboard" icon={LayoutGrid} color="teal">
                        <p className="mb-3">Make the Analytics view your own.</p>
                        <ul className="space-y-2 list-disc pl-4 opacity-80">
                            <li><strong>Reorder Cards:</strong> In the Analytics tab, tap the Settings icon. Use arrows to move charts up or down.</li>
                            <li><strong>Hide/Show:</strong> Toggle the visibility of charts you don't use often.</li>
                        </ul>
                    </GuideSection>

                    <GuideSection id="privacy" title="Privacy Mode" icon={Camera} color="rose">
                        <p>
                            Tap the <strong>Eye icon</strong> in the top header to toggle Privacy Mode. 
                            This hides all monetary values (shows ****), useful when opening the app in public.
                        </p>
                    </GuideSection>
                </div>
            </div>
        </div>
    );
};
