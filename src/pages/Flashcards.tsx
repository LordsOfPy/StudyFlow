import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DeckList } from '@/components/flashcards/DeckList';
import { DeckEditor } from '@/components/flashcards/DeckEditor';
import { ReviewSession } from '@/components/flashcards/ReviewSession';
import { Deck } from '@/types/study';

type View = 'list' | 'edit' | 'review';

export default function FlashcardsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const handleSelectDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setView('edit');
  };

  const handleReviewDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setView('review');
  };

  const handleBack = () => {
    setView('list');
    setSelectedDeck(null);
  };

  const handleStartReview = () => {
    if (selectedDeck) {
      setView('review');
    }
  };

  const handleReviewComplete = () => {
    setView('edit');
  };

  return (
    <Layout>
      {view === 'list' && (
        <DeckList 
          onSelectDeck={handleSelectDeck} 
          onReviewDeck={handleReviewDeck}
        />
      )}
      
      {view === 'edit' && selectedDeck && (
        <DeckEditor 
          deck={selectedDeck} 
          onBack={handleBack}
          onStartReview={handleStartReview}
        />
      )}
      
      {view === 'review' && selectedDeck && (
        <ReviewSession 
          deck={selectedDeck} 
          onBack={() => setView('edit')}
          onComplete={handleReviewComplete}
        />
      )}
    </Layout>
  );
}
