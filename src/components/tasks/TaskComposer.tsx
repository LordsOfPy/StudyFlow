import React, { useState } from 'react';
import { Plus, Clock, Calendar, Flag, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CreateTaskInput, TaskPriority } from '@/types/tasks';

interface TaskComposerProps {
  onSubmit: (task: CreateTaskInput) => Promise<unknown>;
  onCancel?: () => void;
  defaultExpanded?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', color: 'bg-info/10 text-info' },
  high: { label: 'High', color: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgent', color: 'bg-destructive/10 text-destructive' },
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

export function TaskComposer({ onSubmit, onCancel, defaultExpanded = false }: TaskComposerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimateMinutes, setEstimateMinutes] = useState<number | undefined>();
  const [dueAt, setDueAt] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimateMinutes,
        dueAt,
        tags,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setEstimateMinutes(undefined);
      setDueAt(undefined);
      setTags([]);
      setExpanded(false);
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

  const handleCancel = () => {
    setExpanded(false);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setEstimateMinutes(undefined);
    setDueAt(undefined);
    setTags([]);
    onCancel?.();
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full p-4 border-2 border-dashed border-muted-foreground/20 rounded-xl 
                   text-muted-foreground hover:border-primary/40 hover:text-foreground 
                   transition-colors flex items-center gap-2 justify-center"
      >
        <Plus className="h-5 w-5" />
        Add a task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-elevated p-4 space-y-4">
      <div className="space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
          autoFocus
        />
        
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description (optional)"
          className="min-h-[60px] border-0 px-0 focus-visible:ring-0 resize-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Options Row */}
      <div className="flex flex-wrap gap-2">
        {/* Priority */}
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
          <SelectTrigger className="w-auto h-8 gap-2">
            <Flag className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', config.color.split(' ')[0].replace('/10', ''))} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Estimate */}
        <Select 
          value={estimateMinutes?.toString() || ''} 
          onValueChange={(v) => setEstimateMinutes(v ? parseInt(v) : undefined)}
        >
          <SelectTrigger className="w-auto h-8 gap-2">
            <Clock className="h-4 w-4" />
            <SelectValue placeholder="Estimate" />
          </SelectTrigger>
          <SelectContent>
            {timeEstimates.map((est) => (
              <SelectItem key={est.value} value={est.value.toString()}>
                {est.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Due Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Calendar className="h-4 w-4" />
              {dueAt ? format(dueAt, 'MMM d') : 'Due date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dueAt}
              onSelect={setDueAt}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Tags */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Tag className="h-4 w-4" />
              Tags {tags.length > 0 && `(${tags.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
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
          </PopoverContent>
        </Popover>
      </div>

      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
}
