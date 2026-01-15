import React, { useState } from 'react';
import { Plus, MoreHorizontal, BookOpen, Trash2, Edit2 } from 'lucide-react';
import { useFlashcards } from '@/hooks/use-flashcards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { Deck } from '@/types/study';
import { DeckExportImport } from './DeckExportImport';

interface DeckListProps {
  onSelectDeck: (deck: Deck) => void;
  onReviewDeck: (deck: Deck) => void;
}

export function DeckList({ onSelectDeck, onReviewDeck }: DeckListProps) {
  const { decks, createDeck, deleteDeck, loading, refreshDecks } = useFlashcards();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');

  const handleCreateDeck = () => {
    if (!newDeckTitle.trim()) return;
    
    createDeck(newDeckTitle.trim(), newDeckDescription.trim() || undefined);
    setNewDeckTitle('');
    setNewDeckDescription('');
    setIsCreateOpen(false);
  };

  const handleDeleteDeck = (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    deleteDeck(deckId);
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Your Decks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {decks.length === 0 
              ? 'Create your first deck to start studying'
              : `${decks.length} deck${decks.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DeckExportImport onImportComplete={refreshDecks} />
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>
                Add a new flashcard deck to organize your studies.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="e.g., Spanish Vocabulary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  placeholder="What will you learn?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDeck} disabled={!newDeckTitle.trim()}>
                Create Deck
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No decks yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Create your first flashcard deck to start studying with spaced repetition.
          </p>
          <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="card-interactive cursor-pointer group"
              onClick={() => onSelectDeck(deck)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {deck.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectDeck(deck); }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Cards
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteDeck(e, deck.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {deck.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {deck.cardCount} card{deck.cardCount === 1 ? '' : 's'}
                    </span>
                    {deck.dueCount > 0 && (
                      <span className="text-primary font-medium">
                        {deck.dueCount} due
                      </span>
                    )}
                  </div>
                  {deck.dueCount > 0 && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onReviewDeck(deck);
                      }}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
