-- Create notes table for Knowledge Base
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  body_markdown TEXT DEFAULT '',
  folder_id UUID,
  tags TEXT[] DEFAULT '{}',
  backlinks UUID[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create folders table for organization
CREATE TABLE public.note_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.note_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT 'gray',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for folder_id after folders table exists
ALTER TABLE public.notes 
ADD CONSTRAINT notes_folder_id_fkey 
FOREIGN KEY (folder_id) REFERENCES public.note_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view their own notes"
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
USING (auth.uid() = user_id);

-- Folder policies
CREATE POLICY "Users can view their own folders"
ON public.note_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
ON public.note_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.note_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.note_folders FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_folder_id ON public.notes(folder_id);
CREATE INDEX idx_notes_tags ON public.notes USING GIN(tags);
CREATE INDEX idx_notes_backlinks ON public.notes USING GIN(backlinks);
CREATE INDEX idx_note_folders_user_id ON public.note_folders(user_id);
CREATE INDEX idx_note_folders_parent_id ON public.note_folders(parent_id);

-- Triggers for updated_at
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_note_folders_updated_at
BEFORE UPDATE ON public.note_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();