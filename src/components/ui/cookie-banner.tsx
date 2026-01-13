'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check } from 'lucide-react';
import { Button } from './button';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Delay showing the banner for a better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-6 right-6 z-[100] mx-auto max-w-4xl"
                >
                    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-2xl shadow-indigo-500/10">
                        {/* Glow Effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                            {/* Icon Wrapper */}
                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <Cookie className="w-7 h-7 text-indigo-400 animate-pulse" />
                            </div>

                            {/* Content */}
                            <div className="flex-grow text-center md:text-left">
                                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                                    We use cookies to improve your experience
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                    By clicking "Accept All", you agree to the storing of cookies on your device to enhance site navigation, analyze site usage, and assist in our marketing efforts.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Button
                                    variant="ghost"
                                    onClick={handleDecline}
                                    className="flex-1 md:flex-none text-slate-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl font-medium transition-all"
                                >
                                    Decline
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-8 rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    Accept All
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Close button for subtle dismissal */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
