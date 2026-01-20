'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const categories = [
    { id: 'GENERAL', label: 'General Feedback' },
    { id: 'AI_ACCURACY', label: 'AI Accuracy' },
    { id: 'UI_UX', label: 'Design & Experience' },
    { id: 'CONTENT', label: 'CFA Content' },
    { id: 'BUG', label: 'Report a Bug' },
    { id: 'FEATURE_REQUEST', label: 'Feature Request' },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [category, setCategory] = useState('GENERAL');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSubmit = async () => {
        if (rating === 0 || !content.trim()) return;

        setIsSubmitting(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, category, content }),
            });

            if (res.ok) {
                setIsSuccess(true);
                // Reset form after success
                setTimeout(() => {
                    onClose();
                    // Small delay before resetting state to allow exit animation
                    setTimeout(() => {
                        setIsSuccess(false);
                        setRating(0);
                        setContent('');
                        setCategory('GENERAL');
                    }, 500);
                }, 2000);
            }
        } catch (error) {
            console.error('Feedback submission failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
                    >
                        {/* Header */}
                        <div className="p-8 pb-0 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">Share Your Feedback</h2>
                                <p className="text-slate-400 text-sm mt-2 font-medium">Help us make MentisAI better for you.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {isSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Submission Success!</h3>
                                    <p className="text-slate-400 max-w-[280px] leading-relaxed">
                                        Your feedback has been received. Thank you for helping us improve MentisAI!
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Rating */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">How would you rate your experience?</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                    className="transition-transform active:scale-90"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "h-8 w-8 transition-colors",
                                                            (hoverRating || rating) >= star
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "text-slate-700"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-300">What is this about?</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setCategory(cat.id)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                                                        category === cat.id
                                                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                                                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                                    )}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-300">Your comments</label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="What's on your mind? Be as specific as you can..."
                                            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                        />
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || rating === 0 || !content.trim()}
                                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5" />
                                                Submit Feedback
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
