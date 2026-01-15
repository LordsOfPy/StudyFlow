import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Note, NoteFolder } from '@/types/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Pin,
  PinOff,
  Folder,
  Tag,
  Link2,
  X,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Sparkles,
  Pen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';
import { saveDeck, saveCard, saveReview, generateId } from '@/lib/storage';
import { CanvasNote } from './CanvasNote';

interface NoteEditorProps {
  note: Note | null;
  folders: NoteFolder[];
  allNotes: Note[];
  onSave: (note: Partial<Note> & { id?: string }) => void;
  onBack: () => void;
  isNew?: boolean;
}

export function NoteEditor({ note, folders, allNotes, onSave, onBack, isNew }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || 'Untitled');
  const [content, setContent] = useState(note?.bodyMarkdown || '');
  const [folderId, setFolderId] = useState<string | null>(note?.folderId || null);
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [newTag, setNewTag] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const { toast } = useToast();

  // Track changes
  useEffect(() => {
    if (note) {
      const changed =
        title !== note.title ||
        content !== note.bodyMarkdown ||
        folderId !== note.folderId ||
        isPinned !== note.isPinned ||
        JSON.stringify(tags) !== JSON.stringify(note.tags);
      setHasChanges(changed);
    } else {
      setHasChanges(title !== 'Untitled' || content !== '' || tags.length > 0);
    }
  }, [title, content, folderId, tags, isPinned, note]);

  // Auto-save debounce
  useEffect(() => {
    if (!hasChanges || isNew) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, folderId, tags, isPinned, hasChanges, isNew]);

  const handleSave = useCallback(() => {
    onSave({
      id: note?.id,
      title,
      bodyMarkdown: content,
      folderId,
      tags,
      isPinned,
    });
    setHasChanges(false);
  }, [note?.id, title, content, folderId, tags, isPinned, onSave]);

  const handleGenerateFlashcards = async () => {
    if (!content || content.length < 50) {
      toast({
        title: "Not enough content",
        description: "Please write more notes before generating flashcards.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const cards = await aiService.generateFlashcards(content);

      // Create a new deck
      const deckId = generateId();
      saveDeck({
        id: deckId,
        title: `Flashcards: ${title}`,
        description: `Generated from note: ${title}`,
        cardCount: cards.length,
        dueCount: cards.length,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save cards and initial reviews
      cards.forEach(card => {
        const cardId = generateId();

        // 1. Save content
        saveCard({
          id: cardId,
          deckId,
          question: card.front,
          answer: card.back,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // 2. Initialize review state (New card)
        saveReview({
          id: generateId(),
          cardId,
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: new Date(), // Due immediately
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      toast({
        title: "Flashcards Generated!",
        description: `Created ${cards.length} cards in "Flashcards: ${title}"`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Generation Failed",
        description: "Could not generate flashcards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Find backlink suggestions as user types [[
  const backlinkSuggestions = useMemo(() => {
    const match = content.match(/\[\[([^\]]*$)/);
    if (!match) return [];

    const query = match[1].toLowerCase();
    return allNotes
      .filter(n => n.id !== note?.id && n.title.toLowerCase().includes(query))
      .slice(0, 5);
  }, [content, allNotes, note?.id]);

  // Get incoming backlinks
  const incomingLinks = useMemo(() => {
    if (!note) return [];
    return allNotes.filter(n => n.backlinks.includes(note.id));
  }, [note, allNotes]);

  const insertBacklink = (noteTitle: string) => {
    const match = content.match(/\[\[([^\]]*$)/);
    if (match) {
      const before = content.slice(0, match.index);
      const after = content.slice(match.index! + match[0].length);
      setContent(`${before}[[${noteTitle}]]${after}`);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      isZenMode && "fixed inset-0 z-50 bg-background p-8"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-muted-foreground mr-2">
              Unsaved
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFlashcards}
            disabled={isGenerating || content.length < 50}
            className="hidden sm:flex"
          >
            <Sparkles className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
            {isGenerating ? "Generating..." : "AI Flashcards"}
          </Button>
          <div className="w-px h-6 bg-border mx-2 hidden sm:block" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(isPinned && "text-primary")}
          >
            {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsZenMode(!isZenMode)}
          >
            {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant={showCanvas ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setShowCanvas(!showCanvas)}
            title="Toggle Handwriting Canvas"
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges && !isNew}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {!isZenMode && (
        <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
          {/* Folder selector */}
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <Select
              value={folderId || 'none'}
              onValueChange={(v) => setFolderId(v === 'none' ? null : v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tag..."
              className="w-24 h-7 text-sm"
            />
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing... Use [[Note Title]] to create backlinks"
          className="w-full h-full min-h-[400px] resize-none font-mono text-sm leading-relaxed"
        />

        {/* Backlink suggestions popup */}
        {backlinkSuggestions.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-popover border rounded-lg shadow-lg p-2 max-w-xs">
            <p className="text-xs text-muted-foreground mb-2">Link to note:</p>
            {backlinkSuggestions.map(n => (
              <button
                key={n.id}
                onClick={() => insertBacklink(n.title)}
                className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-accent"
              >
                {n.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Area */}
      {showCanvas && (
        <div className="mt-4 mb-4 h-[300px]">
          <CanvasNote
            onChange={(dataUrl) => {
              // Append canvas data URL to markdown as image
              // Optimization: Only update on 'save' or debounce. 
              // For now, let's just log it. Real implementation would upload image.
              console.log('Canvas drawn');
            }}
          />
        </div>
      )}

      {/* Backlinks panel */}
      {!isZenMode && incomingLinks.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link2 className="h-4 w-4" />
            <span>{incomingLinks.length} backlinks</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {incomingLinks.map(link => (
              <Badge key={link.id} variant="outline" className="cursor-pointer hover:bg-accent">
                {link.title}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
