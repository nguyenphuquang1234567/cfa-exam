'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Flag,
    X,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizCard } from '@/components/quiz/quiz-card';
import { QuizTimer } from '@/components/quiz/quiz-timer';
import { QuizProgress } from '@/components/quiz/quiz-progress';
import { QuizResults } from '@/components/quiz/quiz-results';
import { useQuizStore } from '@/store/quiz-store';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ModuleQuizContent() {
    const { moduleId } = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [moduleInfo, setModuleInfo] = useState<{
        title: string,
        code: string,
        readingId?: string,
        bookId?: string
    } | null>(null);

    const {
        questions,
        currentIndex,
        answers,
        isCompleted,
        showExplanation,
        startQuiz,
        setAnswer,
        nextQuestion,
        prevQuestion,
        submitQuiz,
        toggleExplanation,
    } = useQuizStore();

    useEffect(() => {
        const fetchModuleQuizzes = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/quiz/module/${moduleId}`);
                const data = await response.json();

                if (data.error) throw new Error(data.error);

                setModuleInfo({
                    title: data.moduleTitle,
                    code: data.moduleCode,
                    readingId: data.readingId,
                    bookId: data.bookId
                });
                startQuiz(data.questions, 'PRACTICE');
            } catch (error) {
                console.error('Failed to load module quizzes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (moduleId) {
            fetchModuleQuizzes();
        }
    }, [moduleId, startQuiz]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                <p className="text-slate-400 font-medium animate-pulse">Loading Module Quiz...</p>
            </div>
        );
    }

    if (isCompleted) {
        return <QuizResults />;
    }

    const currentQuestion = questions[currentIndex];
    const selectedAnswer = answers[currentQuestion?.id] || null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Quiz Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (moduleInfo?.bookId && moduleInfo?.readingId) {
                                router.push(`/item-sets?bookId=${moduleInfo.bookId}&readingId=${moduleInfo.readingId}`);
                            } else {
                                router.push('/item-sets');
                            }
                        }}
                        className="rounded-full hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            Module {moduleInfo?.code} Quiz
                        </h2>
                        <h1 className="text-xl font-black text-foreground line-clamp-1">
                            {moduleInfo?.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <QuizTimer />
                    <Button variant="outline" size="sm" className="hidden sm:flex border-border/50 font-bold">
                        <Flag className="h-4 w-4 mr-2" />
                        Flag
                    </Button>
                </div>
            </div>

            {/* Progress Boxes */}
            <div className="mb-8">
                <QuizProgress />
            </div>

            {/* Main Question Card */}
            <AnimatePresence mode="wait">
                {currentQuestion && (
                    <QuizCard
                        key={currentQuestion.id}
                        question={currentQuestion}
                        selectedAnswer={selectedAnswer}
                        onSelectAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
                        showResult={selectedAnswer !== null}
                        showExplanation={showExplanation}
                        onToggleExplanation={toggleExplanation}
                        questionNumber={currentIndex + 1}
                        totalQuestions={questions.length}
                    />
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between mt-10 p-6 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-indigo-500/5">
                <Button
                    variant="ghost"
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                    className="font-bold rounded-xl h-12 px-6"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Previous
                </Button>

                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-tighter mb-1">
                        Progress
                    </span>
                    <span className="text-sm font-black text-primary">
                        {Object.keys(answers).length} of {questions.length} answered
                    </span>
                </div>

                {currentIndex === questions.length - 1 ? (
                    <Button
                        onClick={submitQuiz}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-indigo-500/20"
                    >
                        Finish Quiz
                    </Button>
                ) : (
                    <Button
                        onClick={nextQuestion}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-indigo-500/20"
                    >
                        Next
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function ModuleQuizPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                    <p className="text-slate-400 font-bold">Preparing Exam Environment...</p>
                </div>
            }>
                <ModuleQuizContent />
            </Suspense>
        </div>
    );
}
