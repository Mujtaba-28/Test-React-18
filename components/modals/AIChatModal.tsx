
import React from 'react';
const { useState, useRef, useEffect } = React;
import Lucide from 'lucide-react';
const { X, Send, Sparkles, User, Bot, Loader2, AlertTriangle } = Lucide;
import GoogleGenAIModule from "@google/genai";
const { GoogleGenAI, FunctionDeclaration, Type } = GoogleGenAIModule;
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants';

interface AIChatModalProps {
    onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ onClose }) => {
    const { addTransaction, addGoal, updateBudget, addSubscription } = useFinance();
    const { currency } = useTheme();
    const [messages, setMessages] = useState([
        { id: '1', role: 'model', text: `Hi! I can now perform actions. Try saying "Add a goal for New Car 50k" or "Spent 500 on Food".`, timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    const hasApiKey = !!process.env.API_KEY;

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messages]);

    const addTransactionTool = {
        name: 'addTransaction',
        description: 'Add a new financial transaction (expense or income).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER, description: 'Amount of money' },
                category: { type: Type.STRING, description: 'Category name (Food, Transport, Bills, etc)' },
                title: { type: Type.STRING, description: 'Description or Merchant name' },
                type: { type: Type.STRING, enum: ['income', 'expense'], description: 'Type of transaction' }
            },
            required: ['amount', 'category', 'type']
        }
    };

    const addGoalTool = {
        name: 'addGoal',
        description: 'Create a new savings goal.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Name of the goal' },
                targetAmount: { type: Type.NUMBER, description: 'Target amount to save' }
            },
            required: ['name', 'targetAmount']
        }
    };

    const updateBudgetTool = {
        name: 'updateBudget',
        description: 'Update the monthly budget limit.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER, description: 'New monthly budget amount' }
            },
            required: ['amount']
        }
    };
    
    const addSubscriptionTool = {
        name: 'addSubscription',
        description: 'Add a recurring subscription.',
        parameters: {
             type: Type.OBJECT,
             properties: {
                 name: { type: Type.STRING },
                 amount: { type: Type.NUMBER },
                 billingCycle: { type: Type.STRING, enum: ['monthly', 'yearly'] }
             },
             required: ['name', 'amount']
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !hasApiKey) return;
        const userMsg = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `You are an AI financial assistant that can execute actions.
            Today is ${new Date().toISOString().split('T')[0]}.
            Currency: ${currency}. 
            Valid Categories: ${[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c=>c.name).join(', ')}.
            If the user asks to do something, call the appropriate tool. If asking for analysis, just answer text.`;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                config: { 
                    systemInstruction: systemPrompt,
                    tools: [{ functionDeclarations: [addTransactionTool, addGoalTool, updateBudgetTool, addSubscriptionTool] }]
                },
                contents: messages.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            });

            const call = response.functionCalls?.[0];

            if (call) {
                let resultText = "Done.";
                if (call.name === 'addTransaction' && call.args) {
                    const args = call.args;
                    await addTransaction({
                        id: Date.now(),
                        title: args.title || 'AI Entry',
                        category: args.category,
                        amount: args.amount,
                        type: args.type,
                        date: new Date().toISOString()
                    });
                    resultText = `✅ Added ${args.type}: ${currency}${args.amount} for ${args.category}.`;
                } else if (call.name === 'addGoal' && call.args) {
                    const args = call.args;
                    addGoal({
                        id: Date.now().toString(),
                        name: args.name,
                        targetAmount: args.targetAmount,
                        currentAmount: 0,
                        color: 'bg-emerald-500',
                        icon: 'shield'
                    });
                     resultText = `✅ Created goal "${args.name}" for ${currency}${args.targetAmount}.`;
                } else if (call.name === 'updateBudget' && call.args?.amount) {
                    updateBudget(call.args.amount, 'default');
                    resultText = `✅ Budget updated to ${currency}${call.args.amount}.`;
                } else if (call.name === 'addSubscription' && call.args?.name && call.args?.amount) {
                     const args = call.args;
                     addSubscription({
                         id: Date.now().toString(),
                         name: args.name,
                         amount: args.amount,
                         billingCycle: args.billingCycle || 'monthly',
                         nextBillingDate: new Date().toISOString(),
                         category: 'Bills'
                     });
                     resultText = `✅ Added subscription: ${args.name}.`;
                }
                
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: resultText, timestamp: new Date() }]);
                
            } else if (response.text) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text, timestamp: new Date() }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error executing command.", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[110] flex items-end sm:items-center justify-center bg-emerald-950/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#021c17] rounded-[2rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 bg-emerald-600 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-full"><Sparkles size={18}/></div>
                        <div>
                            <h3 className="font-bold">Emerald AI</h3>
                            <p className="text-[10px] opacity-80">Smart Action Capable</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close Chat" className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                {!hasApiKey ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                         <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mb-4">
                             <AlertTriangle size={32}/>
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">AI Not Configured</h3>
                         <p className="text-slate-500 text-sm mb-6">
                             To use the AI Assistant, please deploy the app with a valid Google Gemini API Key.
                         </p>
                         <button onClick={onClose} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300">Close</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#021c17]">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-emerald-100 dark:bg-emerald-900'}`}>
                                        {msg.role === 'user' ? <User size={16} className="text-slate-600 dark:text-slate-300"/> : <Bot size={16} className="text-emerald-600 dark:text-emerald-400"/>}
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#0a3831] text-slate-800 dark:text-emerald-50 shadow-sm border border-slate-100 dark:border-emerald-800/30 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <Loader2 className="animate-spin text-emerald-500 mx-auto"/>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-3 bg-white dark:bg-[#0a3831] border-t border-slate-100 dark:border-emerald-800/30 shrink-0">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Add expense 500 for Food..." 
                                    className="flex-1 bg-slate-100 dark:bg-black/20 rounded-xl px-4 py-3 outline-none text-sm text-slate-900 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-emerald-600 text-white rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors">
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
