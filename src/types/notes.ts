export interface NoteFolder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  color: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  bodyMarkdown: string;
  folderId: string | null;
  tags: string[];
  backlinks: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title?: string;
  bodyMarkdown?: string;
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  bodyMarkdown?: string;
  folderId?: string | null;
  tags?: string[];
  backlinks?: string[];
  isPinned?: boolean;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
  color?: string;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
  color?: string;
  position?: number;
}

// Parsed backlink reference
export interface BacklinkRef {
  noteId: string;
  noteTitle: string;
}
