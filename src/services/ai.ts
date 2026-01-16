import { ChatMessage, AIContext } from "@/types/ai";
import { supabase } from "@/integrations/supabase/client";

// Lovable AI endpoint for edge functions
const LOVABLE_AI_ENDPOINT = "https://adlmeppoejarhcxvlptq.supabase.co/functions/v1/ai-chat";

export const aiService = {
    async sendMessage(text: string, context?: AIContext): Promise<ChatMessage> {
        try {
            const response = await supabase.functions.invoke('ai-chat', {
                body: { 
                    message: text,
                    context: context 
                }
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            return {
                id: crypto.randomUUID(),
                sender: 'ai',
                text: response.data?.response || "I couldn't process your request. Please try again.",
                timestamp: new Date(),
            };
        } catch (error) {
            console.error("AI Service Error:", error);
            
            // Fallback to simple keyword-based responses if edge function fails
            let responseText = "I'm having trouble connecting. Please try again later.";
            
            if (text.toLowerCase().includes("explain")) {
                responseText = "I can explain that concept. The key points are: 1) Break complex topics into smaller pieces, 2) Connect new information to what you already know, 3) Practice active recall by testing yourself.";
            } else if (text.toLowerCase().includes("quiz")) {
                responseText = "I can help create a quiz! Try using the AI Quiz Generator feature in the Quiz section for best results.";
            } else if (text.toLowerCase().includes("hello") || text.toLowerCase().includes("hi")) {
                responseText = "Hello! I'm your AI Study Assistant. I can help you understand concepts, create study materials, and optimize your learning. What would you like to study?";
            } else if (text.toLowerCase().includes("flashcard")) {
                responseText = "For flashcards, head to the Flashcards section and use the AI Generate feature. Paste your notes or describe a topic, and I'll create cards for you!";
            } else if (text.toLowerCase().includes("study") || text.toLowerCase().includes("learn")) {
                responseText = "Great question! Effective studying involves: active recall (testing yourself), spaced repetition (reviewing at optimal intervals), and focused practice. Use the Pomodoro timer for 25-minute focus sessions!";
            }

            return {
                id: crypto.randomUUID(),
                sender: 'ai',
                text: responseText,
                timestamp: new Date(),
            };
        }
    },

    async generateQuiz(noteContent: string): Promise<{ title: string; questions: any[] }> {
        try {
            const response = await supabase.functions.invoke('generate-quiz', {
                body: { content: noteContent }
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            return response.data || {
                title: "Generated Quiz",
                questions: []
            };
        } catch (error) {
            console.error("Quiz generation error:", error);
            
            // Fallback mock response
            const topic = noteContent.split('\n')[0]?.slice(0, 50) || 'General Knowledge';
            return {
                title: `Quiz: ${topic}`,
                questions: [
                    {
                        id: `q-${Date.now()}-1`,
                        type: "multiple_choice",
                        text: "What is the primary concept discussed in this material?",
                        options: ["Active recall", "Passive reading", "Memorization", "Speed reading"],
                        correctAnswer: "Active recall",
                        points: 10
                    },
                    {
                        id: `q-${Date.now()}-2`,
                        type: "multiple_choice",
                        text: "Which study technique is most effective for long-term retention?",
                        options: ["Cramming", "Spaced repetition", "Highlighting", "Re-reading"],
                        correctAnswer: "Spaced repetition",
                        points: 10
                    },
                    {
                        id: `q-${Date.now()}-3`,
                        type: "multiple_choice",
                        text: "What is the recommended focus session length in the Pomodoro technique?",
                        options: ["15 minutes", "25 minutes", "45 minutes", "60 minutes"],
                        correctAnswer: "25 minutes",
                        points: 10
                    }
                ]
            };
        }
    },

    async generateFlashcards(noteContent: string): Promise<{ front: string; back: string }[]> {
        try {
            const response = await supabase.functions.invoke('generate-flashcards', {
                body: { content: noteContent }
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            return response.data?.flashcards || [];
        } catch (error) {
            console.error("Flashcard generation error:", error);
            
            // Fallback - generate basic cards from content
            const lines = noteContent.split('\n').filter(line => line.trim().length > 10);
            const cardCount = Math.min(5, Math.max(3, Math.floor(lines.length / 2)));

            return Array.from({ length: cardCount }).map((_, i) => ({
                front: `Key Concept ${i + 1}`,
                back: lines[i] || `This is an important concept from your notes. Review the original material for details.`
            }));
        }
    }
};