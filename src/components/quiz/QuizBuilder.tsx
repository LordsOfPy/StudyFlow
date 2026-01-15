import React, { useState } from 'react';
import { Quiz, Question, QuestionType } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface QuizBuilderProps {
    onSave: (quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'isAiGenerated'>) => void;
    onCancel: () => void;
}

export function QuizBuilder({ onSave, onCancel }: QuizBuilderProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: crypto.randomUUID(),
            quizId: '', // Set later
            type: 'multiple_choice',
            text: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 10,
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const updateOption = (qId: string, optIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            const newOptions = [...(q.options || [])];
            newOptions[optIndex] = value;
            return { ...q, options: newOptions };
        }));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSave = () => {
        if (!title) return;
        onSave({
            title,
            description,
            questions,
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create New Quiz</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" /> Save Quiz
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Biology Chapter 1"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Textarea
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this quiz about?"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {questions.map((q, idx) => (
                    <Card key={q.id}>
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Question Text</Label>
                                    <Input
                                        value={q.text}
                                        onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                        placeholder="Enter your question here"
                                    />
                                </div>
                                <div className="w-48 space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={q.type}
                                        onValueChange={(v) => updateQuestion(q.id, { type: v as QuestionType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                            <SelectItem value="true_false">True/False</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {q.type === 'multiple_choice' && (
                                <div className="space-y-3 pl-4 border-l-2 border-muted">
                                    <Label>Options (Check correct answer)</Label>
                                    {q.options?.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={q.correctAnswer === opt && opt !== ''}
                                                onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <Input
                                                value={opt}
                                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                                placeholder={`Option ${optIdx + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                <Button variant="outline" className="w-full py-8 border-dashed" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                </Button>
            </div>
        </div>
    );
}
