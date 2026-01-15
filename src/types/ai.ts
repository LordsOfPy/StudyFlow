export type AISender = 'user' | 'ai' | 'system';

export interface ChatMessage {
    id: string;
    sender: AISender;
    text: string;
    timestamp: Date;
    relatedContextId?: string; // Link to a note or quiz
}

export interface AIContext {
    currentNoteId?: string;
    currentSubject?: string;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
}
