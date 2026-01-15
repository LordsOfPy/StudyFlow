import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Flag, Tag, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Task, TaskPriority, UpdateTaskInput } from '@/types/tasks';

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: UpdateTaskInput) => Promise<void>;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted' },
  medium: { label: 'Medium', color: 'bg-info/20' },
  high: { label: 'High', color: 'bg-warning/20' },
  urgent: { label: 'Urgent', color: 'bg-destructive/20' },
};

const timeEstimates = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

export function TaskEditDialog({ task, open, onOpenChange, onSave }: TaskEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimateMinutes, setEstimateMinutes] = useState<number | undefined>();
  const [dueAt, setDueAt] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setEstimateMinutes(task.estimateMinutes);
      setDueAt(task.dueAt);
      setTags(task.tags);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimateMinutes,
        dueAt,
        tags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="text-lg font-medium"
            />
            
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                <Flag className="h-3 w-3" /> Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Estimate */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Estimate
              </label>
              <Select 
                value={estimateMinutes?.toString() || ''} 
                onValueChange={(v) => setEstimateMinutes(v ? parseInt(v) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No estimate" />
                </SelectTrigger>
                <SelectContent>
                  {timeEstimates.map((est) => (
                    <SelectItem key={est.value} value={est.value.toString()}>
                      {est.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Due Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {dueAt ? format(dueAt, 'PPP') : 'No due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueAt}
                  onSelect={setDueAt}
                  initialFocus
                />
                {dueAt && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDueAt(undefined)}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
