import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, FileText, Upload, Loader2, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratedCard {
  question: string;
  answer: string;
  selected: boolean;
}

interface AIGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardsGenerated: (cards: { question: string; answer: string }[]) => void;
}

// Input validation constants (match backend)
const MAX_INPUT_LENGTH = 50000;

export function AIGenerator({ open, onOpenChange, onCardsGenerated }: AIGeneratorProps) {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputType, setInputType] = useState<'text' | 'pdf'>('text');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status when dialog opens
  useEffect(() => {
    if (open) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
      });
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to generate flashcards');
      return;
    }

    // Client-side input validation
    if (inputText.length > MAX_INPUT_LENGTH) {
      toast.error(`Text too long. Maximum ${MAX_INPUT_LENGTH.toLocaleString()} characters allowed.`);
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { text: inputText.trim(), inputType },
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error('Please sign in to use AI flashcard generation');
          setIsAuthenticated(false);
          return;
        }
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.flashcards && data.flashcards.length > 0) {
        setGeneratedCards(
          data.flashcards.map((card: { question: string; answer: string }) => ({
            ...card,
            selected: true,
          }))
        );
        setStep('review');
        toast.success(`Generated ${data.flashcards.length} flashcards!`);
      } else {
        toast.error('No flashcards could be generated from this text');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate flashcards';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCard = (index: number) => {
    setGeneratedCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, selected: !card.selected } : card
      )
    );
  };

  const handleAddCards = () => {
    const selectedCards = generatedCards
      .filter((card) => card.selected)
      .map(({ question, answer }) => ({ question, answer }));

    if (selectedCards.length === 0) {
      toast.error('Please select at least one card to add');
      return;
    }

    onCardsGenerated(selectedCards);
    handleClose();
    toast.success(`Added ${selectedCards.length} cards to your deck!`);
  };

  const handleClose = () => {
    setInputText('');
    setGeneratedCards([]);
    setStep('input');
    setInputType('text');
    onOpenChange(false);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    try {
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setInputText(text);
        setInputType('text');
      } else if (file.type === 'application/pdf') {
        toast.info('PDF support: Please paste the text content from your PDF for now.');
        setInputType('pdf');
      }
    } catch (error) {
      toast.error('Failed to read file');
    }

    event.target.value = '';
  }, []);

  const selectedCount = generatedCards.filter((c) => c.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Flashcard Generator
          </DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? 'Paste your notes, textbook content, or upload a file to generate flashcards automatically.'
              : 'Review and select which flashcards to add to your deck.'}
          </DialogDescription>
        </DialogHeader>

        {/* Auth required message */}
        {isAuthenticated === false && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              AI flashcard generation is a premium feature that requires an account. 
              Sign in or create an account to get started.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}

        {isAuthenticated !== false && step === 'input' && (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your notes, lecture content, or textbook excerpts here..."
                    className="min-h-[200px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {inputText.length.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()} characters
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a text file (.txt, .md) to extract content
                  </p>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,text/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>Choose File</span>
                    </Button>
                  </Label>
                </div>
                {inputText && (
                  <div className="space-y-2">
                    <Label>Extracted Content</Label>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[150px] resize-none"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!inputText.trim() || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {isAuthenticated !== false && step === 'review' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between py-2 border-b mb-4">
              <span className="text-sm text-muted-foreground">
                {selectedCount} of {generatedCards.length} cards selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setGeneratedCards((prev) =>
                    prev.map((c) => ({ ...c, selected: selectedCount < generatedCards.length }))
                  )
                }
              >
                {selectedCount < generatedCards.length ? 'Select All' : 'Deselect All'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {generatedCards.map((card, index) => (
                <div
                  key={index}
                  onClick={() => toggleCard(index)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    card.selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        card.selected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {card.selected && <CheckCircle className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-2">{card.question}</p>
                      <p className="text-sm text-muted-foreground">{card.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleAddCards} disabled={selectedCount === 0} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Add {selectedCount} Card{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
