import { useState, useEffect, useCallback, useMemo } from 'react';
import { Deck, Flashcard, FlashcardReview } from '@/types/study';
import {
  getDecks,
  saveDeck,
  deleteDeck as deleteStoredDeck,
  getCardsByDeck,
  saveCard,
  deleteCard as deleteStoredCard,
  getDueCards,
  getReviewByCard,
  initializeReview,
  generateId,
  updateDeckCounts,
} from '@/lib/storage';
import { processReview } from '@/lib/spaced-repetition';
import { ReviewRating } from '@/types/study';

export function useFlashcards(deckId?: string) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Load decks on mount
  useEffect(() => {
    const loadedDecks = getDecks();
    setDecks(loadedDecks);
    setLoading(false);
  }, []);

  // Load cards when deckId changes
  useEffect(() => {
    if (deckId) {
      const loadedCards = getCardsByDeck(deckId);
      setCards(loadedCards);
    } else {
      setCards([]);
    }
  }, [deckId]);

  const createDeck = useCallback((title: string, description?: string) => {
    const newDeck: Deck = {
      id: generateId(),
      title,
      description,
      cardCount: 0,
      dueCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    saveDeck(newDeck);
    setDecks(prev => [...prev, newDeck]);
    return newDeck;
  }, []);

  const updateDeck = useCallback((deck: Deck) => {
    saveDeck(deck);
    setDecks(prev => prev.map(d => d.id === deck.id ? deck : d));
  }, []);

  const deleteDeck = useCallback((id: string) => {
    deleteStoredDeck(id);
    setDecks(prev => prev.filter(d => d.id !== id));
  }, []);

  const createCard = useCallback((deckId: string, question: string, answer: string) => {
    const newCard: Flashcard = {
      id: generateId(),
      deckId,
      question,
      answer,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    saveCard(newCard);
    setCards(prev => [...prev, newCard]);
    
    // Refresh deck counts
    const updatedDecks = getDecks();
    setDecks(updatedDecks);
    
    return newCard;
  }, []);

  const updateCard = useCallback((card: Flashcard) => {
    saveCard(card);
    setCards(prev => prev.map(c => c.id === card.id ? card : c));
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    deleteStoredCard(cardId);
    setCards(prev => prev.filter(c => c.id !== cardId));
    
    if (card) {
      // Refresh deck counts
      const updatedDecks = getDecks();
      setDecks(updatedDecks);
    }
  }, [cards]);

  const dueCards = useMemo(() => {
    if (!deckId) return [];
    return getDueCards(deckId);
  }, [deckId, cards]);

  const refreshDecks = useCallback(() => {
    const loadedDecks = getDecks();
    setDecks(loadedDecks);
  }, []);

  const refreshCards = useCallback(() => {
    if (deckId) {
      const loadedCards = getCardsByDeck(deckId);
      setCards(loadedCards);
    }
  }, [deckId]);

  return {
    decks,
    cards,
    dueCards,
    loading,
    createDeck,
    updateDeck,
    deleteDeck,
    createCard,
    updateCard,
    deleteCard,
    refreshDecks,
    refreshCards,
  };
}

export function useCardReview(cardId: string) {
  const [review, setReview] = useState<FlashcardReview | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    let currentReview = getReviewByCard(cardId);
    if (!currentReview) {
      currentReview = initializeReview(cardId);
    }
    setReview(currentReview);
    setStartTime(Date.now()); // Reset timer when card changes
  }, [cardId]);

  const submitReview = useCallback((rating: ReviewRating) => {
    if (!review) return;
    const responseTime = Date.now() - startTime;
    const updatedReview = processReview(review, rating, responseTime);
    setReview(updatedReview);
    return updatedReview;
  }, [review, startTime]);

  return {
    review,
    submitReview,
  };
}
