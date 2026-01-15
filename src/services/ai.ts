import { ChatMessage, AIContext } from "@/types/ai";

// Mock delay to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiService = {
    async sendMessage(text: string, context?: AIContext): Promise<ChatMessage> {
        const apiKey = localStorage.getItem('studyflow_openai_key');

        if (apiKey && apiKey.startsWith('sk-')) {
            try {
                // Real API Call (Simplified)
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are a helpful study assistant.' },
                            { role: 'user', content: text }
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return {
                        id: crypto.randomUUID(),
                        sender: 'ai',
                        text: data.choices[0].message.content,
                        timestamp: new Date(),
                    };
                }
            } catch (e) {
                console.error("AI Error", e);
            }
        }

        await delay(1000 + Math.random() * 1000); // 1-2s delay

        // Simple keyword-based mock responses for demo
        let responseText = "That's an interesting topic. Can you tell me more?";

        if (text.toLowerCase().includes("explain")) {
            responseText = "Sure, I can explain that. Conceptually, it involves breaking down the problem into smaller parts...";
        } else if (text.toLowerCase().includes("quiz")) {
            responseText = "I can help you create a quiz for this material. Would you like 5 or 10 questions?";
        } else if (text.toLowerCase().includes("hello") || text.toLowerCase().includes("hi")) {
            responseText = "Hello! I'm your AI Study Assistant. What are we learning today?";
        }

        return {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: responseText,
            timestamp: new Date(),
        };
    },

    async generateQuiz(noteContent: string): Promise<{ title: string; questions: unknown[] }> {
        await delay(2000);
        return {
            title: "AI Generated Quiz",
            questions: [
                {
                    id: "q1",
                    type: "multiple_choice",
                    text: "What is the primary concept discussed in the notes?",
                    options: ["Concept A", "Concept B", "Concept C", "Concept D"],
                    correctAnswer: "Concept A",
                    points: 10
                }
            ]
        };
    },

    async generateFlashcards(noteContent: string): Promise<{ front: string; back: string }[]> {
        await delay(2500);
        // Better mock response based on content length
        const cardCount = Math.max(3, Math.floor(noteContent.length / 200));

        return Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => ({
            front: `Key Concept ${i + 1} from notes`,
            back: `This is the explanation for concept ${i + 1}. Auto-generated from your notes.`
        }));
    }
};
