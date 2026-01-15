import React, { useState } from 'react';
import { Task } from '@/types/tasks';
import { TaskItem } from './TaskItem';
import { TaskComposer } from './TaskComposer';
import { TaskEditDialog } from './TaskEditDialog';
import { useTasks } from '@/hooks/use-tasks';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  showComposer?: boolean;
  onStartFocus?: (task: Task) => void;
  emptyMessage?: string;
  compact?: boolean;
}

export function TaskList({ 
  tasks, 
  loading, 
  showComposer = true,
  onStartFocus,
  emptyMessage = 'No tasks yet',
  compact = false,
}: TaskListProps) {
  const { createTask, updateTask, deleteTask, completeTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (task.status === 'done') {
        await updateTask(id, { status: 'todo' });
      } else {
        await completeTask(id);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showComposer && (
        <TaskComposer onSubmit={createTask} />
      )}

      {tasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onDelete={deleteTask}
              onEdit={setEditingTask}
              onStartFocus={onStartFocus}
              compact={compact}
            />
          ))}
        </div>
      )}

      <TaskEditDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={async (updates) => {
          if (editingTask) {
            await updateTask(editingTask.id, updates);
            setEditingTask(null);
          }
        }}
      />
    </div>
  );
}
