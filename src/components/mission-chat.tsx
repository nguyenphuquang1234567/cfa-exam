'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User } from 'lucide-react';

const CONVERSATION = [
    { role: 'user', content: 'Give me a hint' },
    { role: 'ai', content: 'When yield increases, which bond has the largest price decline? Focus on duration and convexity.' },
    { role: 'user', content: 'Give me the answer please.' },
    { role: 'ai', content: 'The correct answer is: The long-maturity, low-coupon bond.' },
];

export function MissionChat() {
    const [step, setStep] = useState(0); // 0: typing user1, 1: showing ai1, 2: typing user2, 3: showing ai2
    const [displayText, setDisplayText] = useState('');
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);

    useEffect(() => {
        // Typing simulation logic
        const simulateStep = async () => {
            // Step 0: User types "Give me a hint"
            await typeText(CONVERSATION[0].content);
            setMessages(prev => [...prev, CONVERSATION[0]]);
            setDisplayText('');

            // AI Delay
            await wait(800);
            setMessages(prev => [...prev, CONVERSATION[1]]);

            // Delay before next user message
            await wait(2500);

            // Step 2: User types "Give me the answer please."
            await typeText(CONVERSATION[2].content);
            setMessages(prev => [...prev, CONVERSATION[2]]);
            setDisplayText('');

            // AI Delay
            await wait(800);
            setMessages(prev => [...prev, CONVERSATION[3]]);

            // Reset loop after 5 seconds
            await wait(5000);
            setMessages([]);
            simulateStep();
        };

        const typeText = (text: string) => {
            return new Promise((resolve) => {
                let i = 0;
                const interval = setInterval(() => {
                    setDisplayText(text.slice(0, i + 1));
                    i++;
                    if (i === text.length) {
                        clearInterval(interval);
                        setTimeout(resolve, 500);
                    }
                }, 60);
            });
        };

        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        simulateStep();
    }, []);

    return (
        <div className="relative w-full max-w-sm mx-auto">
            <div className="flex flex-col gap-3 min-h-[350px]">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i + msg.content}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 20, stiffness: 150 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'glass border-indigo-500/20 text-slate-200 shadow-xl'
                                }`}>
                                {msg.role === 'ai' && (
                                    <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3" />
                                        AI Instructor
                                    </div>
                                )}
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Input area showing active typing */}
                <div className="mt-4 glass p-3 rounded-xl border-white/5 flex items-center gap-2">
                    <div className="flex-1 text-xs text-slate-400 font-medium px-2 h-6 flex items-center overflow-hidden">
                        {displayText}
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-[2px] h-3 bg-indigo-500 ml-0.5"
                        />
                    </div>
                    <div className="h-6 w-6 rounded bg-indigo-600/50 flex items-center justify-center">
                        <Send className="w-3 h-3 text-white/50" />
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[100px] -z-10 rounded-full" />
        </div>
    );
}
