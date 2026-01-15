import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Calendar, Flag, MoreHorizontal, 
  Trash2, Edit, Play, GripVertical 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Task, TaskPriority } from '@/types/tasks';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  compact?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; dotColor: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  medium: { label: 'Medium', color: 'text-info', dotColor: 'bg-info' },
  high: { label: 'High', color: 'text-warning', dotColor: 'bg-warning' },
  urgent: { label: 'Urgent', color: 'text-destructive', dotColor: 'bg-destructive' },
};

export function TaskItem({ 
  task, 
  onComplete, 
  onDelete, 
  onEdit, 
  onStartFocus,
  compact = false 
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const priorityStyle = priorityConfig[task.priority];
  
  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt);
  const isDone = task.status === 'done';

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all',
        'hover:bg-muted/50',
        isDone && 'opacity-60',
        isOverdue && !isDone && 'border-l-2 border-destructive'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <button className="opacity-0 group-hover:opacity-50 cursor-grab mt-0.5">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onComplete(task.id)}
        className={cn(
          'mt-0.5 transition-colors',
          isDone ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        )}
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium text-sm leading-tight',
              isDone && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>
            
            {!compact && task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Priority indicator */}
              <div className={cn('flex items-center gap-1', priorityStyle.color)}>
                <div className={cn('w-1.5 h-1.5 rounded-full', priorityStyle.dotColor)} />
                <span className="text-xs">{priorityStyle.label}</span>
              </div>

              {/* Time estimate */}
              {task.estimateMinutes && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {task.estimateMinutes >= 60 
                      ? `${Math.floor(task.estimateMinutes / 60)}h ${task.estimateMinutes % 60}m`
                      : `${task.estimateMinutes}m`
                    }
                  </span>
                </div>
              )}

              {/* Due date */}
              {task.dueAt && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue && !isDone ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>{formatDueDate(task.dueAt)}</span>
                </div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{task.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={cn(
            'flex items-center gap-1 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            {onStartFocus && !isDone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onStartFocus(task)}
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
