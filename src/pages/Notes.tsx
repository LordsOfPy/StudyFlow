import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { NotesList } from '@/components/notes/NotesList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { GraphView } from '@/components/notes/GraphView';
import { FolderDialog } from '@/components/notes/FolderDialog';
import { useNotes } from '@/hooks/use-notes';
import { useAuth } from '@/contexts/AuthContext';
import { Note } from '@/types/notes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Network, Loader2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notes() {
  const { user } = useAuth();
  const { 
    notes, 
    folders, 
    isLoading, 
    createNote, 
    updateNote, 
    deleteNote,
    createFolder,
    deleteFolder 
  } = useNotes();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Notes & Knowledge Base</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create markdown notes with backlinks, organize with folders, and visualize your knowledge graph.
          </p>
          <Link to="/auth">
            <Button variant="hero" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in to get started
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsCreatingNote(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
  };

  const handleSaveNote = async (noteData: Partial<Note> & { id?: string }) => {
    if (noteData.id) {
      await updateNote.mutateAsync({ id: noteData.id, ...noteData });
      // Update local state
      const updated = notes.find(n => n.id === noteData.id);
      if (updated) {
        setSelectedNote({ ...updated, ...noteData } as Note);
      }
    } else {
      const result = await createNote.mutateAsync({
        title: noteData.title,
        bodyMarkdown: noteData.bodyMarkdown,
        folderId: noteData.folderId,
        tags: noteData.tags,
        isPinned: noteData.isPinned,
      });
      setIsCreatingNote(false);
      // Select the newly created note
      if (result) {
        setSelectedNote({
          id: result.id,
          userId: result.user_id,
          title: result.title,
          bodyMarkdown: result.body_markdown || '',
          folderId: result.folder_id,
          tags: result.tags || [],
          backlinks: result.backlinks || [],
          isPinned: result.is_pinned || false,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        });
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote.mutateAsync(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const handleCreateFolder = (name: string, color: string) => {
    createFolder.mutate({ name, color });
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder.mutateAsync(id);
    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
  };

  const handleBack = () => {
    setSelectedNote(null);
    setIsCreatingNote(false);
  };

  const showEditor = selectedNote !== null || isCreatingNote;

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-display">Notes & Knowledge Base</h1>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')}>
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <FileText className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="graph" className="gap-2">
                <Network className="h-4 w-4" />
                Graph
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {viewMode === 'list' ? (
            <>
              {/* Sidebar */}
              <div className="w-80 shrink-0 bg-card rounded-lg overflow-hidden">
                <NotesList
                  notes={notes}
                  folders={folders}
                  selectedNoteId={selectedNote?.id || null}
                  selectedFolderId={selectedFolderId}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectNote={handleSelectNote}
                  onSelectFolder={setSelectedFolderId}
                  onCreateNote={handleCreateNote}
                  onDeleteNote={handleDeleteNote}
                  onCreateFolder={() => setFolderDialogOpen(true)}
                  onDeleteFolder={handleDeleteFolder}
                />
              </div>

              {/* Editor */}
              <div className="flex-1 bg-card rounded-lg p-4 overflow-hidden">
                {showEditor ? (
                  <NoteEditor
                    note={selectedNote}
                    folders={folders}
                    allNotes={notes}
                    onSave={handleSaveNote}
                    onBack={handleBack}
                    isNew={isCreatingNote}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p>Select a note or create a new one</p>
                    <Button variant="link" onClick={handleCreateNote}>
                      Create new note
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 bg-card rounded-lg p-4">
              <GraphView
                notes={notes}
                selectedNoteId={selectedNote?.id || null}
                onSelectNote={(note) => {
                  setSelectedNote(note);
                  setViewMode('list');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSubmit={handleCreateFolder}
      />
    </Layout>
  );
}
