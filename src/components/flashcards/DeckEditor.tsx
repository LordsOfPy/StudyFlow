import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Play, MoreHorizontal, Sparkles } from 'lucide-react';
import { useFlashcards } from '@/hooks/use-flashcards';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Deck, Flashcard } from '@/types/study';
import { cn } from '@/lib/utils';
import { AIGenerator } from './AIGenerator';

interface DeckEditorProps {
  deck: Deck;
  onBack: () => void;
  onStartReview: () => void;
}

export function DeckEditor({ deck, onBack, onStartReview }: DeckEditorProps) {
  const { cards, dueCards, createCard, updateCard, deleteCard, refreshCards } = useFlashcards(deck.id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleAICardsGenerated = (generatedCards: { question: string; answer: string }[]) => {
    generatedCards.forEach((card) => {
      createCard(deck.id, card.question, card.answer);
    });
    refreshCards();
  };

  const handleCreateCard = () => {
    if (!question.trim() || !answer.trim()) return;
    
    createCard(deck.id, question.trim(), answer.trim());
    setQuestion('');
    setAnswer('');
    setIsCreateOpen(false);
  };

  const handleUpdateCard = () => {
    if (!editingCard || !question.trim() || !answer.trim()) return;
    
    updateCard({
      ...editingCard,
      question: question.trim(),
      answer: answer.trim(),
    });
    setEditingCard(null);
    setQuestion('');
    setAnswer('');
    refreshCards();
  };

  const handleEditClick = (card: Flashcard) => {
    setEditingCard(card);
    setQuestion(card.question);
    setAnswer(card.answer);
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId);
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setEditingCard(null);
    setQuestion('');
    setAnswer('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold font-display">{deck.title}</h2>
            <p className="text-sm text-muted-foreground">
              {cards.length} card{cards.length === 1 ? '' : 's'}
              {dueCards.length > 0 && ` • ${dueCards.length} due`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {dueCards.length > 0 && (
            <Button onClick={onStartReview} className="gap-2">
              <Play className="h-4 w-4" />
              Review ({dueCards.length})
            </Button>
          )}
          <Button 
            variant="outline" 
            className="gap-2 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40"
            onClick={() => setIsAIGeneratorOpen(true)}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI Generate
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Card</DialogTitle>
                <DialogDescription>
                  Create a new flashcard for {deck.title}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question (Front)</Label>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter the question..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer (Back)</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter the answer..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCard} disabled={!question.trim() || !answer.trim()}>
                  Add Card
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Card List */}
      {cards.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <h3 className="text-lg font-semibold">No cards yet</h3>
          <p className="text-muted-foreground mt-2">
            Add your first flashcard to this deck.
          </p>
          <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="card-elevated p-5 group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  Question
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(card)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="font-medium mb-4">{card.question}</p>
              <div className="border-t border-border pt-3">
                <span className="text-xs font-medium text-muted-foreground">Answer</span>
                <p className="text-sm text-muted-foreground mt-1">{card.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-question">Question (Front)</Label>
              <Textarea
                id="edit-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer (Back)</Label>
              <Textarea
                id="edit-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCard} disabled={!question.trim() || !answer.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generator */}
      <AIGenerator
        open={isAIGeneratorOpen}
        onOpenChange={setIsAIGeneratorOpen}
        onCardsGenerated={handleAICardsGenerated}
      />
    </div>
  );
}
