'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, MessageCircle, X, Trash2, RotateCcw, ImageIcon, Paperclip, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface GlobalChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatMath = (content: string) => {
    return content
        .replace(/\\\[/g, '$$$$')
        .replace(/\\\]/g, '$$$$')
        .replace(/\\\(/g, '$')
        .replace(/\\\)/g, '$')
        .replace(/\\\\/g, '\\');
};

export function GlobalChatbot({ isOpen, onClose }: GlobalChatbotProps) {
    const { user } = useAuth();
    const { questions, currentIndex, isActive } = useQuizStore();
    const currentQuestion = isActive ? questions[currentIndex] : null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const item = e.clipboardData.items[0];
        if (item?.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) processFile(file);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || isLoading || !user) return;

        const userMessage = input.trim();
        const currentImage = selectedImage;
        setInput('');
        setSelectedImage(null);

        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/quiz/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: newMessages,
                    question: currentQuestion?.content,
                    explanation: currentQuestion?.explanation,
                    options: currentQuestion ? {
                        A: currentQuestion.optionA,
                        B: currentQuestion.optionB,
                        C: currentQuestion.optionC
                    } : undefined,
                    topic: currentQuestion?.topic?.id || 'General CFA Support',
                    isGlobal: true,
                    image: currentImage // Base64 string
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to get response');
            }

            // Handle Streaming Response
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            // Add an empty assistant message to start streaming into
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            let assistantReply = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                assistantReply += chunk;

                // Update the last message in the list
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = { role: 'assistant', content: assistantReply };
                    return next;
                });
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Connection error'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Small delay to ensure Radix has mounted the content in its portal
        const timer = setTimeout(() => {
            const dialog = dialogRef.current;
            if (!dialog) return;

            const handleWheel = (e: WheelEvent) => {
                if (scrollRef.current) {
                    // Manually scroll the chat content container
                    scrollRef.current.scrollTop += e.deltaY;

                    // CRITICAL: Block scroll from bubbling up to background
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            // Attach non-passive listener to the whole dialog content area
            dialog.addEventListener('wheel', handleWheel, { passive: false });
            return () => dialog.removeEventListener('wheel', handleWheel);
        }, 50);

        return () => clearTimeout(timer);
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                ref={dialogRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="max-w-[98vw] w-[1600px] h-[90vh] p-0 overflow-hidden border-border/50 bg-background/60 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl flex flex-col gap-0 outline-none select-none [&>button]:hidden z-[60]"
            >
                {/* Drag Overlay */}
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-indigo-600/20 backdrop-blur-sm border-4 border-dashed border-indigo-500 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 pointer-events-none"
                        >
                            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl animate-bounce">
                                <UploadCloud className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-3xl font-black text-white drop-shadow-lg">Drop your image to analyze</h3>
                            <p className="text-indigo-100 font-medium">Any graph, chart, or question screenshot</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Header */}
                <div className="px-8 py-6 border-b border-border/50 bg-indigo-500/5 flex items-center justify-between shrink-0 select-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Bot className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                Mentis Global AI Advisor
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                    {isActive ? `Question #${currentIndex + 1} Context Active` : 'CFA Knowledge Base Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMessages([])}
                            className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-muted-foreground/30"
                            title="Clear Chat"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-muted transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Chat Content */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col custom-scrollbar-thick select-auto overscroll-contain"
                >
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center max-w-2xl mx-auto space-y-8 py-12">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0"
                            >
                                <Sparkles className="w-12 h-12" />
                            </motion.div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                                    How can I help you?
                                </h2>
                                <p className="text-lg text-muted-foreground font-medium">
                                    I have access to your current quiz, all SchweserNotes, and curriculum materials.
                                </p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${m.role === 'user' ? 'bg-indigo-600' : 'bg-muted border border-border/50'
                                        }`}>
                                        {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-500" />}
                                    </div>
                                    <div className={`p-6 rounded-[2.5rem] text-base leading-relaxed ${m.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none shadow-xl shadow-indigo-500/20'
                                        : 'bg-muted/30 text-foreground rounded-bl-none border border-border/50 backdrop-blur-md'
                                        }`}>
                                        {m.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-indigo max-w-none break-words">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>,
                                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                                        strong: ({ children }) => <strong className="font-bold text-indigo-400">{children}</strong>,
                                                        code: ({ children }) => <code className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-sm">{children}</code>
                                                    }}
                                                >
                                                    {formatMath(m.content)}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-muted border border-border/50 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="bg-muted/30 p-6 rounded-[2.5rem] rounded-bl-none border border-border/50 backdrop-blur-md">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer Input */}
                <div className="p-8 bg-muted/20 border-t border-border/50 shrink-0 select-auto">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative max-w-5xl mx-auto"
                    >
                        {/* Image Preview Container */}
                        <AnimatePresence>
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full mb-4 left-0 p-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center gap-3"
                                >
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/50">
                                        <img src={selectedImage} alt="Selection preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="pr-4">
                                        <p className="text-sm font-bold text-foreground">Image Attached</p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">Ready to analyze</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                        />

                        <div className="relative flex items-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className={`absolute left-2 w-12 h-12 rounded-[1rem] transition-all ${selectedImage ? 'text-indigo-500 bg-indigo-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <Paperclip className="w-6 h-6" />
                            </Button>

                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onPaste={handlePaste}
                                placeholder={isActive ? "Ask about the current question or any CFA topic..." : "Talk to your AI Advisor about anything..."}
                                disabled={isLoading}
                                className="pr-16 pl-16 bg-background/50 border-border/50 rounded-[2rem] h-16 text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-muted-foreground/50 shadow-inner outline-none"
                            />

                            <Button
                                type="submit"
                                size="icon"
                                disabled={(!input.trim() && !selectedImage) || isLoading}
                                className="absolute right-2 h-12 w-12 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-[1.25rem] transition-all active:scale-95 shadow-lg shadow-indigo-500/20 group"
                            >
                                <Send className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
