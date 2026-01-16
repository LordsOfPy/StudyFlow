import React, { useState } from 'react';
import { Quiz } from '@/types/quiz';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, BrainCircuit, Trash2, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuizListProps {
    quizzes: Quiz[];
    onSelectQuiz: (quiz: Quiz) => void;
    onCreateQuiz: () => void;
    onGenerateQuiz: () => void;
    onDeleteQuiz?: (quizId: string) => void;
}

export function QuizList({ quizzes, onSelectQuiz, onCreateQuiz, onGenerateQuiz, onDeleteQuiz }: QuizListProps) {
    const [search, setSearch] = useState('');

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (e: React.MouseEvent, quizId: string) => {
        e.stopPropagation();
        if (onDeleteQuiz) {
            onDeleteQuiz(quizId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search quizzes..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={onGenerateQuiz} variant="secondary" className="gap-2">
                        <BrainCircuit className="h-4 w-4" />
                        Generate with AI
                    </Button>
                    <Button onClick={onCreateQuiz} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Quiz
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuizzes.map((quiz) => (
                    <Card 
                        key={quiz.id} 
                        className="hover:border-primary/50 transition-colors cursor-pointer group relative" 
                        onClick={() => onSelectQuiz(quiz)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                                <div className="flex items-center gap-2">
                                    {quiz.isAiGenerated && (
                                        <Badge variant="secondary" className="gap-1">
                                            <BrainCircuit className="h-3 w-3" />
                                            AI
                                        </Badge>
                                    )}
                                    {onDeleteQuiz && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={(e) => handleDelete(e, quiz.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                {quiz.description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="text-sm text-muted-foreground justify-between">
                            <span>{quiz.questions.length} questions</span>
                            <span>{new Date(quiz.updatedAt).toLocaleDateString()}</span>
                        </CardFooter>
                    </Card>
                ))}

                {filteredQuizzes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No quizzes found. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
