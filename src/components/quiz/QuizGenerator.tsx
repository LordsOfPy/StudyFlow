import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { aiService } from '@/services/ai';
import { Quiz, Question } from '@/types/quiz';
import { toast } from 'sonner';

interface QuizGeneratorProps {
    onQuizGenerated: (quiz: Partial<Quiz>) => void;
    onCancel: () => void;
}

export function QuizGenerator({ onQuizGenerated, onCancel }: QuizGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [sourceText, setSourceText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic && !sourceText) return;

        setIsLoading(true);
        try {
            // Combine topic and source text for the prompt
            const prompt = `Topic: ${topic}\n\nContext:\n${sourceText}`;
            const generatedData = await aiService.generateQuiz(prompt);

            // Transform generated questions to proper Question type
            const questions: Question[] = generatedData.questions.map((q: any, index: number) => ({
                id: q.id || `q-${Date.now()}-${index}`,
                quizId: '',
                type: q.type || 'multiple_choice',
                text: q.text || '',
                options: q.options || [],
                correctAnswer: q.correctAnswer || '',
                explanation: q.explanation,
                points: q.points || 10
            }));

            const quizData: Partial<Quiz> = {
                title: generatedData.title || `Quiz: ${topic}`,
                description: `AI-generated quiz about ${topic}`,
                questions,
                isAiGenerated: true
            };

            onQuizGenerated(quizData);
            toast.success('Quiz generated successfully!');
        } catch (error) {
            console.error("Failed to generate quiz:", error);
            toast.error('Failed to generate quiz. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        Generate Quiz with AI
                    </CardTitle>
                    <CardDescription>
                        Enter a topic or paste specific content (notes, article) to generate a quiz instantly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic / Subject</Label>
                        <Input
                            id="topic"
                            placeholder="e.g. Photosynthesis, World War II, Linear Algebra"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="context">Source Context (Optional)</Label>
                        <Textarea
                            id="context"
                            placeholder="Paste your notes or text here for more accurate questions..."
                            className="min-h-[150px] resize-none"
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || (!topic && !sourceText)}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <BrainCircuit className="h-4 w-4" />
                                Generate Quiz
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
