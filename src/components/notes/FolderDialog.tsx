import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FOLDER_COLORS = [
  { name: 'Gray', value: 'gray' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
}

export function FolderDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialName = '', 
  initialColor = 'gray' 
}: FolderDialogProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), color);
      setName('');
      setColor('gray');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialName ? 'Edit Folder' : 'New Folder'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c.value ? 'border-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ 
                    backgroundColor: c.value === 'gray' ? 'hsl(var(--muted))' : c.value 
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {initialName ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
