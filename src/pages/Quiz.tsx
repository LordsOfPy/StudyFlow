import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { QuizList } from '@/components/quiz/QuizList';
import { QuizBuilder } from '@/components/quiz/QuizBuilder';
import { QuizGenerator } from '@/components/quiz/QuizGenerator';
import { QuizTaker } from '@/components/quiz/QuizTaker';
import { Quiz, QuizAttempt } from '@/types/quiz';
import { BrainCircuit } from 'lucide-react';
import { generateId, saveQuizAttempt, getQuizzes, saveQuiz } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ViewState = 'list' | 'create' | 'generate' | 'take';

export default function QuizPage() {
    const [view, setView] = useState<ViewState>('list');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Load quizzes from storage on mount
    useEffect(() => {
        const storedQuizzes = getQuizzes();
        setQuizzes(storedQuizzes);
        setLoading(false);
    }, []);

    const handleSaveQuiz = (quizData: Partial<Quiz>) => {
        const newQuiz: Quiz = {
            id: quizData.id || generateId(),
            title: quizData.title || 'Untitled Quiz',
            description: quizData.description,
            questions: quizData.questions || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isAiGenerated: quizData.isAiGenerated || false
        };
        
        saveQuiz(newQuiz);
        setQuizzes(prev => [newQuiz, ...prev]);
        setView('list');
        toast.success('Quiz saved successfully!');
    };

    const handleDeleteQuiz = (quizId: string) => {
        // Remove from local state and storage
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
        setQuizzes(updatedQuizzes);
        localStorage.setItem('studyflow_quizzes', JSON.stringify(updatedQuizzes));
        toast.success('Quiz deleted');
    };

    const handleSelectQuiz = (quiz: Quiz) => {
        if (quiz.questions.length > 0) {
            setActiveQuiz(quiz);
            setView('take');
        } else {
            toast.error("This quiz has no questions yet!");
        }
    };

    const handleQuizComplete = (result: {
        score: number;
        maxScore: number;
        answers: Record<string, string | boolean>;
        startedAt: Date;
        completedAt: Date;
    }) => {
        if (!activeQuiz) return;

        const attempt: QuizAttempt = {
            id: generateId(),
            quizId: activeQuiz.id,
            userId: user?.id || 'anonymous',
            startedAt: result.startedAt,
            completedAt: result.completedAt,
            score: result.score,
            maxScore: result.maxScore,
            answers: result.answers
        };
        
        saveQuizAttempt(attempt);
        
        const percentage = Math.round((result.score / result.maxScore) * 100);
        toast.success(`Quiz Completed! You scored ${result.score}/${result.maxScore} (${percentage}%)`);
    };

    if (loading) {
        return (
            <Layout>
                <div className="space-y-6 animate-pulse">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 rounded-xl bg-muted" />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="h-full flex flex-col space-y-6">
                {view === 'list' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold font-display flex items-center gap-3">
                                    <BrainCircuit className="h-8 w-8 text-primary" />
                                    Quiz Engine
                                </h1>
                                <p className="text-muted-foreground">
                                    Test your knowledge with AI-generated quizzes or create your own.
                                </p>
                            </div>
                        </div>
                        <QuizList
                            quizzes={quizzes}
                            onSelectQuiz={handleSelectQuiz}
                            onCreateQuiz={() => setView('create')}
                            onGenerateQuiz={() => setView('generate')}
                            onDeleteQuiz={handleDeleteQuiz}
                        />
                    </>
                )}

                {view === 'create' && (
                    <QuizBuilder
                        onSave={handleSaveQuiz}
                        onCancel={() => setView('list')}
                    />
                )}

                {view === 'generate' && (
                    <QuizGenerator
                        onQuizGenerated={handleSaveQuiz}
                        onCancel={() => setView('list')}
                    />
                )}

                {view === 'take' && activeQuiz && (
                    <QuizTaker
                        quiz={activeQuiz}
                        onComplete={handleQuizComplete}
                        onExit={() => {
                            setActiveQuiz(null);
                            setView('list');
                        }}
                    />
                )}
            </div>
        </Layout>
    );
}