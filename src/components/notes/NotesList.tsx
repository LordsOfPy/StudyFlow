import React from 'react';
import { Note, NoteFolder } from '@/types/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Pin, 
  Folder, 
  FileText, 
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotesListProps {
  notes: Note[];
  folders: NoteFolder[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (note: Note) => void;
  onSelectFolder: (folderId: string | null) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
}

export function NotesList({
  notes,
  folders,
  selectedNoteId,
  selectedFolderId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
  onDeleteNote,
  onCreateFolder,
  onDeleteFolder,
}: NotesListProps) {
  // Filter notes based on folder and search
  const filteredNotes = notes.filter(note => {
    const matchesFolder = selectedFolderId === null || note.folderId === selectedFolderId;
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.bodyMarkdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  // Sort: pinned first, then by updated date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pinnedNotes = sortedNotes.filter(n => n.isPinned);
  const regularNotes = sortedNotes.filter(n => !n.isPinned);

  const getNotesInFolder = (folderId: string) => notes.filter(n => n.folderId === folderId).length;

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Notes</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onCreateFolder} title="New folder">
              <Folder className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCreateNote} title="New note">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Folders */}
        <div className="p-2">
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedFolderId === null ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>All Notes</span>
            <Badge variant="secondary" className="ml-auto">{notes.length}</Badge>
          </button>

          {folders.map(folder => (
            <div key={folder.id} className="group">
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedFolderId === folder.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
              >
                <Folder className="h-4 w-4" style={{ color: folder.color !== 'gray' ? folder.color : undefined }} />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                <Badge variant="secondary">{getNotesInFolder(folder.id)}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            </div>
          ))}
        </div>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="p-2 pt-0">
            <p className="px-3 py-1 text-xs text-muted-foreground font-medium">Pinned</p>
            {pinnedNotes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={onSelectNote}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        )}

        {/* Regular Notes */}
        <div className="p-2 pt-0">
          {pinnedNotes.length > 0 && regularNotes.length > 0 && (
            <p className="px-3 py-1 text-xs text-muted-foreground font-medium">Notes</p>
          )}
          {regularNotes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={onSelectNote}
              onDelete={onDeleteNote}
            />
          ))}

          {sortedNotes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <Button variant="link" size="sm" onClick={onCreateNote}>
                Create your first note
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function NoteItem({ 
  note, 
  isSelected, 
  onSelect, 
  onDelete 
}: { 
  note: Note; 
  isSelected: boolean; 
  onSelect: (note: Note) => void; 
  onDelete: (id: string) => void;
}) {
  // Get preview text (first line or truncated content)
  const preview = note.bodyMarkdown
    .replace(/^#+ /, '')
    .split('\n')[0]
    .slice(0, 60) || 'No content';

  return (
    <button
      onClick={() => onSelect(note)}
      className={cn(
        "w-full group flex flex-col items-start gap-1 px-3 py-2 rounded-lg text-sm transition-colors text-left",
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
      )}
    >
      <div className="flex items-center gap-2 w-full">
        {note.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
        <span className="font-medium truncate flex-1">{note.title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-xs text-muted-foreground truncate w-full">{preview}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
        {note.tags.length > 0 && (
          <>
            <span>•</span>
            <span>{note.tags.slice(0, 2).join(', ')}</span>
          </>
        )}
      </div>
    </button>
  );
}
