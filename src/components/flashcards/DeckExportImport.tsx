import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
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
import { Deck, Flashcard, FlashcardReview } from '@/types/study';
import { 
  getDecks, 
  getCards, 
  getReviews, 
  saveDeck, 
  saveCard, 
  saveReview,
  generateId,
  updateDeckCounts
} from '@/lib/storage';
import { toast } from 'sonner';

interface ExportData {
  version: string;
  exportedAt: string;
  decks: Array<{
    deck: Deck;
    cards: Flashcard[];
    reviews: FlashcardReview[];
  }>;
}

interface DeckExportImportProps {
  onImportComplete?: () => void;
}

export function DeckExportImport({ onImportComplete }: DeckExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importData, setImportData] = React.useState<ExportData | null>(null);
  const [importing, setImporting] = React.useState(false);

  const handleExport = () => {
    try {
      const decks = getDecks();
      const allCards = getCards();
      const allReviews = getReviews();

      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        decks: decks.map(deck => ({
          deck,
          cards: allCards.filter(c => c.deckId === deck.id),
          reviews: allReviews.filter(r => 
            allCards.filter(c => c.deckId === deck.id).some(c => c.id === r.cardId)
          ),
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${decks.length} deck${decks.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export decks');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        // Validate structure
        if (!data.version || !data.decks || !Array.isArray(data.decks)) {
          throw new Error('Invalid file format');
        }

        setImportData(data);
        setIsImportOpen(true);
      } catch (error) {
        console.error('Parse error:', error);
        toast.error('Invalid backup file format');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!importData) return;

    setImporting(true);
    try {
      const existingDecks = getDecks();
      let importedDecks = 0;
      let importedCards = 0;

      for (const deckData of importData.decks) {
        // Check if deck with same title exists
        const existingDeck = existingDecks.find(d => d.title === deckData.deck.title);
        
        // Create new IDs to avoid conflicts
        const newDeckId = generateId();
        const cardIdMap = new Map<string, string>();

        // Create deck
        const newDeck: Deck = {
          ...deckData.deck,
          id: existingDeck ? generateId() : newDeckId,
          title: existingDeck 
            ? `${deckData.deck.title} (Imported)`
            : deckData.deck.title,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        saveDeck(newDeck);
        importedDecks++;

        // Create cards with new IDs
        for (const card of deckData.cards) {
          const newCardId = generateId();
          cardIdMap.set(card.id, newCardId);

          const newCard: Flashcard = {
            ...card,
            id: newCardId,
            deckId: newDeck.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          saveCard(newCard);
          importedCards++;
        }

        // Create reviews with mapped card IDs
        for (const review of deckData.reviews) {
          const newCardId = cardIdMap.get(review.cardId);
          if (newCardId) {
            const newReview: FlashcardReview = {
              ...review,
              id: generateId(),
              cardId: newCardId,
              nextReview: new Date(review.nextReview),
              lastReviewed: review.lastReviewed ? new Date(review.lastReviewed) : undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            saveReview(newReview);
          }
        }

        updateDeckCounts(newDeck.id);
      }

      toast.success(`Imported ${importedDecks} deck${importedDecks === 1 ? '' : 's'} with ${importedCards} cards`);
      setIsImportOpen(false);
      setImportData(null);
      onImportComplete?.();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import decks');
    } finally {
      setImporting(false);
    }
  };

  const totalCards = importData?.decks.reduce((acc, d) => acc + d.cards.length, 0) ?? 0;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
        <Download className="h-4 w-4" />
        Export All
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Decks</DialogTitle>
            <DialogDescription>
              This backup contains {importData?.decks.length ?? 0} deck{(importData?.decks.length ?? 0) === 1 ? '' : 's'} with {totalCards} card{totalCards === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {importData?.exportedAt && (
                <>Exported on: {new Date(importData.exportedAt).toLocaleDateString()}</>
              )}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {importData?.decks.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{d.deck.title}</span>
                  <span className="text-muted-foreground">
                    ({d.cards.length} cards)
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : 'Import All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
