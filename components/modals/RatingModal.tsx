import React, { useState, useEffect } from 'react';
import { X, Star, Heart, Send, MessageSquare } from 'lucide-react';

interface RatingModalProps {
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load previous rating if exists
    try {
        const saved = localStorage.getItem('emerald_user_rating');
        if (saved) {
            const data = JSON.parse(saved);
            setRating(data.rating);
            setFeedback(data.feedback || '');
        }
    } catch(e) {}
  }, []);

  const handleSubmit = () => {
    localStorage.setItem('emerald_user_rating', JSON.stringify({ 
        rating, 
        feedback, 
        date: new Date().toISOString() 
    }));
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  const getEmoji = () => {
    const r = hoverRating || rating;
    if (r === 0) return '👋';
    if (r >= 5) return '🤩';
    if (r >= 4) return '😊';
    if (r >= 3) return '😐';
    if (r >= 2) return '😕';
    return '😢';
  };

  const getTitle = () => {
    const r = hoverRating || rating;
    if (r === 0) return 'Enjoying Emerald?';
    if (r >= 5) return 'That\'s Awesome!';
    if (r >= 4) return 'Glad you like it!';
    if (r >= 3) return 'We can do better.';
    return 'Oh no! Sorry.';
  };

  return (
    <div className="absolute inset-0 z-[150] flex items-center justify-center bg-emerald-950/40 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#062c26] rounded-[2.5rem] p-8 shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Success Overlay */}
        {submitted && (
            <div className="absolute inset-0 z-20 bg-emerald-500 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <Heart size={40} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-black">Thank You!</h3>
                <p className="text-emerald-100 font-medium">Your feedback helps us grow.</p>
            </div>
        )}

        <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
                <span className="text-4xl mb-2 animate-in bounce-in duration-500" key={getEmoji()}>{getEmoji()}</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{getTitle()}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Rate your experience</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={24} className="text-slate-400"/>
            </button>
        </div>

        <div className="flex justify-between mb-8 px-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="group relative focus:outline-none transition-transform active:scale-90 hover:scale-110 duration-200"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                >
                    <Star 
                        size={36} 
                        className={`transition-all duration-300 ${
                            star <= (hoverRating || rating) 
                            ? 'fill-amber-400 text-amber-400 drop-shadow-md' 
                            : 'text-slate-200 dark:text-slate-700'
                        }`} 
                        strokeWidth={star <= (hoverRating || rating) ? 0 : 2}
                    />
                </button>
            ))}
        </div>

        <div className="space-y-4">
            <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400">
                    <MessageSquare size={16}/>
                </div>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what you love or what we can improve..."
                    className="w-full h-28 pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/20 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-black/40 outline-none text-sm font-medium text-slate-700 dark:text-emerald-50 resize-none transition-all placeholder:text-slate-400"
                ></textarea>
            </div>

            <button 
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full py-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
                <Send size={18} /> Submit Feedback
            </button>
        </div>

      </div>
    </div>
  );
};