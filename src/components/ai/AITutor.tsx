import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, X, Send, Sparkles, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/ai';
import { aiService } from '@/services/ai';

export function AITutor() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom on new message
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiService.sendMessage(userMsg.text);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                sender: 'system',
                text: "Sorry, I'm having trouble connecting right now. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 animate-in zoom-in duration-300"
                size="icon"
            >
                <Sparkles className="h-6 w-6" />
            </Button>
        );
    }

    if (isMinimized) {
        return (
            <Card className="fixed bottom-6 right-6 w-72 z-50 shadow-xl border-primary/20">
                <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 bg-primary/5 cursor-pointer" onClick={() => setIsMinimized(false)}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-primary" />
                        AI Tutor (Active)
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[600px] flex flex-col z-50 shadow-xl border-primary/20 animate-in slide-in-from-bottom-10 duration-200">
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 border-b bg-primary/5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI Study Tutor
                </CardTitle>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
                        <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-background/50 backdrop-blur-sm">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 opacity-70">
                            <BrainCircuit className="h-12 w-12 mb-4 text-primary/30" />
                            <p className="text-sm">Hi! I'm your AI tutor. Ask me to explain a concept, quiz you on a topic, or summarize your notes.</p>
                        </div>
                    )}

                    <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full gap-2",
                                    msg.sender === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.sender === 'ai' && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <BrainCircuit className="h-4 w-4 text-primary" />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                        msg.sender === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground border"
                                    )}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <BrainCircuit className="h-4 w-4 text-primary" />
                                </div>
                                <div className="bg-muted border rounded-lg px-3 py-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t bg-background">
                <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <Input
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
