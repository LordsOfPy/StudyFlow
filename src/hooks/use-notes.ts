import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Note, NoteFolder, CreateNoteInput, UpdateNoteInput, CreateFolderInput, UpdateFolderInput } from '@/types/notes';
import { useToast } from '@/hooks/use-toast';

// Helper to extract [[backlinks]] from markdown
function extractBacklinks(markdown: string, allNotes: Note[]): string[] {
  const backlinkRegex = /\[\[([^\]]+)\]\]/g;
  const matches = [...markdown.matchAll(backlinkRegex)];
  const titles = matches.map(m => m[1].toLowerCase());
  
  return allNotes
    .filter(note => titles.includes(note.title.toLowerCase()))
    .map(note => note.id);
}

export function useNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        bodyMarkdown: n.body_markdown || '',
        folderId: n.folder_id,
        tags: n.tags || [],
        backlinks: n.backlinks || [],
        isPinned: n.is_pinned || false,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })) as Note[];
    },
    enabled: !!user,
  });

  // Fetch all folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['note_folders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('note_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []).map(f => ({
        id: f.id,
        userId: f.user_id,
        name: f.name,
        parentId: f.parent_id,
        color: f.color || 'gray',
        position: f.position || 0,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })) as NoteFolder[];
    },
    enabled: !!user,
  });

  // Create note
  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: input.title || 'Untitled',
          body_markdown: input.bodyMarkdown || '',
          folder_id: input.folderId || null,
          tags: input.tags || [],
          is_pinned: input.isPinned || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note created' });
    },
    onError: (error) => {
      toast({ title: 'Error creating note', description: error.message, variant: 'destructive' });
    },
  });

  // Update note
  const updateNote = useMutation({
    mutationFn: async ({ id, ...input }: UpdateNoteInput & { id: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Calculate backlinks from content
      const backlinks = input.bodyMarkdown 
        ? extractBacklinks(input.bodyMarkdown, notes.filter(n => n.id !== id))
        : undefined;

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.bodyMarkdown !== undefined) updateData.body_markdown = input.bodyMarkdown;
      if (input.folderId !== undefined) updateData.folder_id = input.folderId;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (backlinks !== undefined) updateData.backlinks = backlinks;
      if (input.isPinned !== undefined) updateData.is_pinned = input.isPinned;

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      toast({ title: 'Error updating note', description: error.message, variant: 'destructive' });
    },
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting note', description: error.message, variant: 'destructive' });
    },
  });

  // Create folder
  const createFolder = useMutation({
    mutationFn: async (input: CreateFolderInput) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('note_folders')
        .insert({
          user_id: user.id,
          name: input.name,
          parent_id: input.parentId || null,
          color: input.color || 'gray',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note_folders'] });
      toast({ title: 'Folder created' });
    },
    onError: (error) => {
      toast({ title: 'Error creating folder', description: error.message, variant: 'destructive' });
    },
  });

  // Update folder
  const updateFolder = useMutation({
    mutationFn: async ({ id, ...input }: UpdateFolderInput & { id: string }) => {
      if (!user) throw new Error('Must be logged in');

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.parentId !== undefined) updateData.parent_id = input.parentId;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.position !== undefined) updateData.position = input.position;

      const { data, error } = await supabase
        .from('note_folders')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note_folders'] });
    },
    onError: (error) => {
      toast({ title: 'Error updating folder', description: error.message, variant: 'destructive' });
    },
  });

  // Delete folder
  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('note_folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note_folders'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Folder deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting folder', description: error.message, variant: 'destructive' });
    },
  });

  // Get notes that link to a specific note (incoming backlinks)
  const getIncomingBacklinks = (noteId: string) => {
    return notes.filter(n => n.backlinks.includes(noteId));
  };

  // Search notes by title or content
  const searchNotes = (query: string) => {
    const lower = query.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(lower) || 
      n.bodyMarkdown.toLowerCase().includes(lower) ||
      n.tags.some(t => t.toLowerCase().includes(lower))
    );
  };

  return {
    notes,
    folders,
    isLoading: notesLoading || foldersLoading,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    updateFolder,
    deleteFolder,
    getIncomingBacklinks,
    searchNotes,
  };
}
