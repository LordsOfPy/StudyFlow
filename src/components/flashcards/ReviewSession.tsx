import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useFlashcards, useCardReview } from '@/hooks/use-flashcards';
import { Button } from '@/components/ui/button';
import { Deck, Flashcard, ReviewRating } from '@/types/study';
import { getNextReviewText } from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';
import { getReviewByCard } from '@/lib/storage';

interface ReviewSessionProps {
  deck: Deck;
  onBack: () => void;
  onComplete: () => void;
}

const ratingConfig: Record<ReviewRating, { label: string; color: string; shortcut: string }> = {
  again: { label: 'Again', color: 'bg-destructive text-destructive-foreground', shortcut: '1' },
  hard: { label: 'Hard', color: 'bg-warning text-warning-foreground', shortcut: '2' },
  good: { label: 'Good', color: 'bg-success text-success-foreground', shortcut: '3' },
  easy: { label: 'Easy', color: 'bg-primary text-primary-foreground', shortcut: '4' },
};

function ReviewCard({ card, onRate, onBack }: {
  card: Flashcard;
  onRate: (rating: ReviewRating) => void;
  onBack: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { review } = useCardReview(card.id);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRate = useCallback((rating: ReviewRating) => {
    onRate(rating);
    setIsFlipped(false);
  }, [onRate]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!isFlipped) {
          handleFlip();
        }
      }
      if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleFlip, handleRate]);

  const currentInterval = review?.interval || 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card */}
      {/* Card */}
      <div
        className="perspective-1000 min-h-[300px] w-full cursor-pointer"
        onClick={!isFlipped ? handleFlip : undefined}
      >
        <div className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d min-h-[300px]",
          isFlipped ? "rotate-y-180" : ""
        )}>
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden card-elevated p-8 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              Question
            </span>
            <p className="text-xl font-medium">
              {card.cardType === 'cloze' && card.clozeContent
                ? card.clozeContent.replace(/{{(.*?)}}/g, '___')
                : card.question}
            </p>
            <p className="text-sm text-muted-foreground mt-8">
              Click or press Space to reveal answer
            </p>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card-elevated p-8 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-success bg-success/10 px-3 py-1 rounded-full mb-6">
              Answer
            </span>
            <p className="text-xl font-medium">
              {card.cardType === 'cloze' && card.clozeContent
                ? (
                  <span>
                    {card.clozeContent.split(/({{.*?}})/).map((part, i) => {
                      if (part.startsWith('{{') && part.endsWith('}}')) {
                        return <span key={i} className="text-success font-bold">{part.slice(2, -2)}</span>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </span>
                )
                : card.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      {isFlipped && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground text-center">
            How well did you remember?
          </p>
          <div className="grid grid-cols-4 gap-3">
            {(Object.entries(ratingConfig) as [ReviewRating, typeof ratingConfig[ReviewRating]][]).map(
              ([rating, config]) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-4 px-3 rounded-xl font-medium transition-all',
                    'hover:scale-105 active:scale-95',
                    config.color
                  )}
                >
                  <span className="text-sm">{config.label}</span>
                  <span className="text-xs opacity-75">
                    {getNextReviewText(rating, currentInterval)}
                  </span>
                  <span className="text-[10px] opacity-50 mt-1">
                    ({config.shortcut})
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {!isFlipped && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Review
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReviewSession({ deck, onBack, onComplete }: ReviewSessionProps) {
  const { dueCards, refreshDecks } = useFlashcards(deck.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>(() => [...dueCards]);
  const { submitReview } = useCardReview(sessionCards[currentIndex]?.id || '');

  const currentCard = sessionCards[currentIndex];
  const totalCards = sessionCards.length;

  const handleRate = useCallback((rating: ReviewRating) => {
    submitReview(rating);
    setCardsReviewed(prev => prev + 1);

    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete
      refreshDecks();
      onComplete();
    }
  }, [currentIndex, totalCards, submitReview, refreshDecks, onComplete]);

  if (!currentCard || totalCards === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold font-display">All done!</h2>
        <p className="text-muted-foreground mt-2">
          No more cards to review in this deck.
        </p>
        <Button className="mt-6" onClick={onBack}>
          Back to Deck
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">{deck.title}</p>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalCards} cards
          </p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
        />
      </div>

      {/* Review Card */}
      <ReviewCard
        key={currentCard.id}
        card={currentCard}
        onRate={handleRate}
        onBack={onBack}
      />
    </div>
  );
}
