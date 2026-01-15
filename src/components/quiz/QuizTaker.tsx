import React, { useState } from 'react';
import { Quiz, Question } from '@/types/quiz';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizTakerProps {
    quiz: Quiz;
    onComplete: (result: { score: number, maxScore: number, answers: Record<string, string>, startedAt: Date, completedAt: Date }) => void;
    onExit: () => void;
}

export function QuizTaker({ quiz, onComplete, onExit }: QuizTakerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [startedAt] = useState(new Date());

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const hasAnsweredCurrent = !!answers[currentQuestion.id];

    const handleAnswer = (value: string) => {
        if (showResult) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    };

    const calculateScore = () => {
        let total = 0;
        quiz.questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                total += q.points;
            }
        });
        return total;
    };

    const finishQuiz = () => {
        const finalScore = calculateScore();
        const maxScore = quiz.questions.reduce((acc, q) => acc + q.points, 0);
        const completedAt = new Date();

        setScore(finalScore);
        setShowResult(true);

        onComplete({
            score: finalScore,
            maxScore,
            answers,
            startedAt,
            completedAt
        });
    };

    if (showResult) {
        const maxScore = quiz.questions.reduce((acc, q) => acc + q.points, 0);
        const percentage = Math.round((score / maxScore) * 100);

        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <Card className="text-center py-8">
                    <CardHeader>
                        <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-6xl font-bold text-primary">{percentage}%</div>
                        <p className="text-muted-foreground">
                            You scored {score} out of {maxScore} points
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center gap-4">
                        <Button variant="outline" onClick={onExit}>Back to List</Button>
                        <Button onClick={() => {
                            setShowResult(false);
                            setCurrentQuestionIndex(0);
                            setAnswers({});
                            setScore(0);
                        }}>Retry Quiz</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span>{Math.round(((currentQuestionIndex) / quiz.questions.length) * 100)}% Complete</span>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex gap-2">
                        <span className="text-muted-foreground opacity-50">#{currentQuestionIndex + 1}</span>
                        {currentQuestion.text}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentQuestion.type === 'multiple_choice' && (
                        <RadioGroup
                            value={answers[currentQuestion.id]}
                            onValueChange={handleAnswer}
                            className="space-y-3"
                        >
                            {currentQuestion.options?.map((option, idx) => (
                                <div key={idx} className={cn(
                                    "flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                                    answers[currentQuestion.id] === option && "border-primary bg-primary/5"
                                )}>
                                    <RadioGroupItem value={option} id={`opt-${idx}`} />
                                    <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-medium">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                    {/* Add other types (true/false, open ended) here */}
                </CardContent>
                <CardFooter className="justify-between border-t pt-6">
                    <Button
                        variant="ghost"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        Previous
                    </Button>

                    {isLastQuestion ? (
                        <Button onClick={finishQuiz} disabled={!hasAnsweredCurrent} className="gap-2">
                            Finish Quiz <CheckCircle2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            disabled={!hasAnsweredCurrent}
                            className="gap-2"
                        >
                            Next Question <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
