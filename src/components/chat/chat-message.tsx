import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
    message: {
        role: string;
        content: string;
        image?: string;
    };
    user?: {
        name?: string | null;
    };
    onImageClick: (image: string) => void;
}

const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const formatMath = (content: string) => {
    return content
        .replace(/\\\[/g, '$$$$')
        .replace(/\\\]/g, '$$$$')
        .replace(/\\\(/g, '$')
        .replace(/\\\)/g, '$')
        .replace(/\\\\/g, '\\');
};

export const ChatMessage = memo(({ message, user, onImageClick }: ChatMessageProps) => {
    const isUser = message.role === 'user';
    const initials = getInitials(user?.name);

    return (
        <div className={`group w-full border-b border-border/30 last:border-0 ${isUser ? 'bg-muted/30' : ''}`}>
            <div className={`max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex gap-3 sm:gap-4 md:gap-6 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0">
                    {!isUser ? (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 shadow-lg p-0.5 bg-background relative overflow-hidden">
                            <Image
                                src="/images/ai-avatar.png"
                                alt="AI Advisor"
                                width={36}
                                height={36}
                                className="object-contain rounded-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center border border-white/10 shadow-lg text-[10px] font-bold text-white uppercase text-center">
                            {initials}
                        </div>
                    )}
                </div>
                <div className={`flex-1 min-w-0 space-y-2 ${isUser ? 'text-right' : ''}`}>
                    <div className={`font-bold text-[12px] sm:text-[13px] text-muted-foreground flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                        {!isUser ? 'AI Advisor' : 'You'}
                    </div>
                    <div className="prose dark:prose-invert prose-indigo max-w-none break-words text-[14px] sm:text-[15px] leading-relaxed text-foreground antialiased shadow-indigo-500/10">
                        {message.image && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-4 rounded-xl overflow-hidden border border-white/10 cursor-zoom-in group/img relative shadow-2xl inline-block"
                                onClick={() => onImageClick(message.image!)}
                            >
                                <img
                                    src={message.image}
                                    alt="Uploaded"
                                    className="max-h-80 w-auto object-contain transition-transform group-hover/img:scale-[1.01]"
                                />
                            </motion.div>
                        )}
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        >
                            {formatMath(message.content)}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
});

ChatMessage.displayName = 'ChatMessage';
